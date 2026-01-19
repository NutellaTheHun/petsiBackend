import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
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
    private readonly orderContainerItemRepo: Repository<OrderContainerItem>,

    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,

    @InjectRepository(MenuItemContainerItem)
    private readonly menuItemContainerItemRepo: Repository<MenuItemContainerItem>,

    @InjectRepository(OrderMenuItem)
    private readonly orderMenuItemRepo: Repository<OrderMenuItem>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(
      orderContainerItemRepo,
      'OrderContainerItem',
      requestContextService,
      logger,
    );
  }

  protected async doValidateCreateNode(
    dto: CreateOrderContainerItemDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Validate Contained item
    const containedItem = await this.menuItemRepo.findOne({
      where: { id: dto.containedMenuItemId },
      relations: ['sizes'],
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

    // validate contained item / size combination
    await this.helper.enforceInList(
      dto.containedItemSizeId,
      containedItem.sizes.map((x) => x.id),
      'containedItemSize',
      results,
      'Invalid size',
      id,
    );

    const parentMenuItem = await this.menuItemRepo.findOne({
      where: { id: dto.parentMenuItemIdCtx },
      relations: ['sizes', 'containerMenuItems'],
    });
    if (!parentMenuItem) {
      throw new NotFoundException();
    }
    // validate parent item type is container
    if (parentMenuItem.type !== MENU_ITEM_TYPES.CONTAINER) {
      const err = new ValidationErrorNode(
        'type',
        id,
        'parent item must be of type container',
      );
      results.push(err);
    }

    // validate parent item / size combination
    await this.helper.enforceInList(
      dto.parentMenuItemSizeIdCtx,
      parentMenuItem.sizes.map((x) => x.id),
      'parentItemSize',
      results,
      'Invalid size',
      id,
    );

    // Validate contained item and size is valid in parent container
    const containerItems = await this.menuItemContainerItemRepo.find({
      where: {
        parentMenuItem: { id: dto.parentMenuItemIdCtx },
        parentItemSize: { id: dto.parentMenuItemSizeIdCtx },
      },
      relations: ['containedItem', 'containedItemSize'],
    });
    if (containerItems.length === 0) {
      throw new Error();
    }

    const containedItemSizeCombination = `${dto.containedMenuItemId}:${dto.containedItemSizeId}`;
    await this.helper.enforceInList(
      containedItemSizeCombination,
      containerItems.map(
        (x) => `${x.containedMenuItem.id}:${x.containedItemSize.id}`,
      ),
      'containedItemSize',
      results,
      'Invalid size for container',
      id,
    );

    // validate parent menu item is not equal to contained menu item
    if (parentMenuItem.id === containedItem.id) {
      const err = new ValidationErrorNode(
        'parentMenuItem',
        id,
        'parent menu item cannot be equal to contained menu item',
      );
      results.push(err);
    }

    // validate quantity is greater than 0
    await this.helper.enforcePositive(
      dto.quantity,
      'quantity',
      results,
      'quantity must be greater than 0',
      id,
    );

    if (parentMenuItem.variableMaxAmount) {
      if (dto.quantity !== parentMenuItem.variableMaxAmount) {
        const err = new ValidationErrorNode(
          'quantity',
          id,
          'quantity must be less than or equal to the variable max amount',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateOrderContainerItemDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    const currentEntity = await this.orderContainerItemRepo.findOne({
      where: { id },
      relations: ['containedItem', 'containedItemSize', 'parentOrderMenuItem'],
    });
    if (!currentEntity) {
      throw new Error();
    }

    const parentContainer = await this.menuItemRepo.findOne({
      where: { id: dto.parentMenuItemIdCtx },
      relations: [
        'containerMenuItems',
        'containerMenuItems.containedItem',
        'containerMenuItems.containedItemSize',
      ],
    });
    if (!parentContainer) {
      throw new NotFoundException();
    }

    // Validate new MenuItem / Size combination
    if (dto.containedMenuItemId || dto.containedItemSizeId) {
      const containedItemId =
        dto.containedMenuItemId ?? currentEntity.containedMenuItem.id;
      const containedItemSizeId =
        dto.containedItemSizeId ?? currentEntity.containedItemSize.id;

      const containedItem = await this.menuItemRepo.findOne({
        where: { id: containedItemId },
        relations: ['sizes'],
      });
      if (!containedItem) {
        throw new NotFoundException();
      }

      // validate contained item type is single
      if (containedItem.type !== MENU_ITEM_TYPES.SINGLE) {
        const err = new ValidationErrorNode(
          'containedMenuItem',
          id,
          'contained item must be of type single',
        );
        results.push(err);
      }

      // validate parent item is not equal to contained item
      if (parentContainer.id === containedItem.id) {
        const err = new ValidationErrorNode(
          'parentMenuItem',
          id,
          'parent menu item cannot be equal to contained menu item',
        );
        results.push(err);
      }

      // validate item size is valid for contained item
      await this.helper.enforceInList(
        containedItemSizeId,
        containedItem.sizes.map((x) => x.id),
        'containedItemSize',
        results,
        'Invalid size',
        id,
      );

      // must be valid in parent container
      await this.helper.enforceInList(
        `${containedItemId}:${containedItemSizeId}`,
        parentContainer.containerMenuItems.map(
          (x) => `${x.containedMenuItem.id}:${x.containedItemSize.id}`,
        ),
        'containedItemSize',
        results,
        'Invalid size for container',
      );
    }

    // validate quantity
    if (dto.quantity) {
      await this.helper.enforcePositive(
        dto.quantity,
        'quantity',
        results,
        'quantity must be greater than 0',
        id,
      );

      if (parentContainer.variableMaxAmount) {
        if (dto.quantity !== parentContainer.variableMaxAmount) {
          const err = new ValidationErrorNode(
            'quantity',
            id,
            'quantity must be equal to the variable max amount',
          );
          results.push(err);
        }
      }
    }

    return this.checkValidateResult(results);
  }
}
