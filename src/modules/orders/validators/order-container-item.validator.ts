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
      !this.helper.isValidSize(
        dto.containedMenuItemSizeId,
        containedItem.validSizes,
      )
    ) {
      const err = new ValidationErrorNode(
        'containedItemSize',
        id,
        'Invalid size for contained item.',
      );
      results.push(err);
    }

    // validate parent / container item
    // validate containerItem is valid to the orderMenuItem
    const parentItem = await this.menuItemRepo.findOne({
      where: { id: dto.parentContainerMenuItemId },
      relations: ['containerItems'],
    });

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
    let containedItem: MenuItem | null = null;

    if (dto.containedMenuItemId) {
      containedItem = await this.menuItemRepo.findOne({
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

    if (dto.containedMenuItemSizeId) {
      if (!containedItem) {
        containedItem = await this.menuItemRepo.findOne({
          where: { id: dto.containedMenuItemId },
          relations: ['validSizes'],
        });
        if (!containedItem) {
          throw new Error(
            `OrderContainerItem validator: contained menu item with id ${dto.containedMenuItemId}`,
          );
        }
      }
      // should validate against MenuItemContainer settings, not the menuItem validSizes
      if (
        !this.helper.isValidSize(
          dto.containedMenuItemSizeId,
          containedItem.validSizes,
        )
      ) {
        const err = new ValidationErrorNode(
          'containedItemSize',
          id,
          'Invalid size for contained item.',
        );
        results.push(err);
      }
    }

    if (dto.containedMenuItemId || dto.containedMenuItemSizeId) {
      const toUpdate = await this.repo.findOne({
        where: { id },
        relations: [
          'parentOrderItem',
          'parentOrderItem.menuItem',
          'parentOrderItem.size',
          'parentOrderItem.menuItem.variableRules',
          'parentOrderItem.menuItem.fixedContents',
        ],
      });
      if (!toUpdate) {
        throw new Error(
          `OrderContainerItem validation: order container item being updated not found.`,
        );
      }
    }

    if (dto.quantity && dto.quantity <= 0) {
      const err = new ValidationErrorNode(
        'quantity',
        id,
        'quantity must be greater than 0',
      );
      results.push(err);
    }

    // requires ParentContainer id to validate contained item or size
    if (
      (dto.containedMenuItemId || dto.containedMenuItemSizeId) &&
      !dto.parentContainerMenuItemId
    ) {
      const err = new ValidationErrorNode(
        'parentOrderItem',
        id,
        'Missing parent container item id.',
      );
      results.push(err);
    }

    if (
      id &&
      (dto.containedMenuItemId || dto.containedMenuItemSizeId) &&
      dto.parentContainerMenuItemId
    ) {
      const containerItem = await this.repo.findOne({
        where: { id },
        relations: ['containedItem', 'containedItemSize'],
      });
      if (!containerItem) {
        throw new NotFoundException();
      }
      const itemId = dto.containedMenuItemId ?? containerItem.containedItem.id;
      const sizeId =
        dto.containedMenuItemSizeId ?? containerItem.containedItemSize.id;

      const containedSize = await this.menuItemSizeRepo.findOne({
        where: { id: sizeId },
      });
      if (!containedSize) {
        throw new NotFoundException();
      }

      const containedItem = await this.menuItemRepo.findOne({
        where: { id: itemId },
        relations: ['validSizes'],
      });
      if (!containedItem) {
        throw new NotFoundException();
      }

      // validate item / size
      if (!this.helper.isValidSize(sizeId, containedItem.validSizes)) {
        const err = new ValidationErrorNode(
          'containedItemSize',
          id,
          'Invalid size for item.',
        );
        results.push(err);
      }
    }
    return this.checkValidateResult(results);
  }
}
