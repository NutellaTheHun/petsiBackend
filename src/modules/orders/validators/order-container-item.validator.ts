import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/menu-items.module';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import {
  OrderContainerItem,
  OrderContainerItemEntity,
} from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';

@Injectable()
export class OrderContainerItemValidator extends ValidatorBase<OrderContainerItemEntity> {
  constructor(
    @InjectRepository(OrderContainerItem)
    private readonly repo: Repository<OrderContainerItem>,

    @InjectRepository(MenuItemSize)
    private readonly menuItemSizeRepo: Repository<MenuItemSize>,

    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,

    @InjectRepository(OrderMenuItem)
    private readonly orderMenuItemRepo: Repository<OrderMenuItem>,

    @InjectRepository(MenuItemContainerItem)
    private readonly menuItemContainerItemRepo: Repository<MenuItemContainerItem>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'OrderContainerItem', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateOrderContainerItemDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    const containedItem = await this.menuItemRepo.findOne({
      where: { id: dto.containedMenuItemId },
      relations: ['validSizes'],
    });
    if (!containedItem) {
      throw new NotFoundException();
    }

    // contained item type single
    if (containedItem.type !== MENU_ITEM_TYPES.SINGLE) {
      const err = new ValidationErrorNode(
        'type',
        id,
        'Only items of type single can be in a container',
      );
      results.push(err);
    }

    // contained item size
    if (
      !this.helper.isValidSize(dto.containedItemSizeId, containedItem.sizes)
    ) {
      const err = new ValidationErrorNode(
        'containedItemSize',
        id,
        'Invalid size for contained item.',
      );
      results.push(err);
    }

    // validate parent
    // validate containerItem is valid to the parent container
    const parentOrderItem = await this.orderMenuItemRepo.findOne({
      where: { id: dto.parentOrderMenuItemId },
      relations: ['menuItem', 'size'],
    });
    if (!parentOrderItem) {
      throw new Error();
    }
    if (parentOrderItem.menuItem.type !== MENU_ITEM_TYPES.CONTAINER) {
      throw new Error();
    }

    const validItems = await this.menuItemContainerItemRepo.find({
      where: {
        parentMenuItem: { id: parentOrderItem.menuItem.id },
        parentItemSize: { id: parentOrderItem.size.id },
      },
      relations: ['containedItem', 'containedItemSize'],
    });
    if (validItems.length === 0) {
      throw new Error();
    }

    const isValid = validItems.find(
      (x) =>
        x.containedMenuItem.id === dto.containedMenuItemId &&
        x.containedItemSize.id === dto.containedItemSizeId,
    );
    if (!isValid) {
      const err = new ValidationErrorNode(
        'containedItem',
        id,
        'invalid item for container',
      );
      results.push(err);
    }

    // validate quantity
    if (dto.quantity <= 0) {
      const err = new ValidationErrorNode(
        'quantity',
        id,
        'quantity must be greater than 0',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateOrderContainerItemDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Validate new MenuItem / Size combination is valid for parent container
    if (dto.containedMenuItemId || dto.containedItemSizeId) {
      const currentEntity = await this.repo.findOne({
        where: { id },
        relations: [
          'containedItem',
          'containedItemSize',
          'parentOrderItem',
          'parentOrderItem.menuItem',
          'parentOrderItem.size',
        ],
      });
      if (!currentEntity) {
        throw new Error();
      }
      const validContainerItems = await this.menuItemContainerItemRepo.find({
        where: {
          parentMenuItem: { id: currentEntity.parentOrderMenuItem.menuItem.id },
          parentItemSize: { id: currentEntity.parentOrderMenuItem.size.id },
        },
        relations: ['containedItem', 'containedItemSize'],
      });
      if (validContainerItems.length === 0) {
        throw new Error();
      }

      const itemId =
        dto.containedMenuItemId ?? currentEntity.containedMenuItem.id;
      const sizeId =
        dto.containedItemSizeId ?? currentEntity.containedItemSize.id;

      const isValid = validContainerItems.find(
        (x) =>
          x.containedMenuItem.id === itemId &&
          x.containedItemSize.id === sizeId,
      );
      if (!isValid) {
        const err = new ValidationErrorNode(
          'containedItem',
          id,
          'invalid item for container',
        );
        results.push(err);
      }
    }

    // Validate new contained item is type 'single'
    if (dto.containedMenuItemId) {
      const containedItem = await this.menuItemRepo.findOne({
        where: { id: dto.containedMenuItemId },
        relations: ['validSizes'],
      });
      if (!containedItem) {
        throw new Error(
          `OrderContainerItem validator: contained menu item with id ${dto.containedMenuItemId}`,
        );
      }

      if (containedItem.type !== MENU_ITEM_TYPES.SINGLE) {
        const err = new ValidationErrorNode(
          'containedItem',
          id,
          'contained item must be of type single.',
        );
        results.push(err);
      }
    }

    // validate quantity
    if (dto.quantity && dto.quantity <= 0) {
      const err = new ValidationErrorNode(
        'quantity',
        id,
        'quantity must be greater than 0',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }
}
