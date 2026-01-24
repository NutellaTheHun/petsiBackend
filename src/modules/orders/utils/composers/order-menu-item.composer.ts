import { EntityManager, EntityTarget } from 'typeorm';
import { ComposerBase } from '../../../../common/base/composer.base';
import { MenuItemSize } from '../../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { CreateOrderMenuItemDto } from '../../dto/order-menu-item/create-order-menu-item.dto';
import { NestedCreateOrderMenuItemDto } from '../../dto/order-menu-item/nested-create-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../../dto/order-menu-item/update-order-menu-item.dto';
import { OrderContainerItem } from '../../entities/order-container-item.entity';
import {
  OrderMenuItem,
  OrderMenuItemEntity,
} from '../../entities/order-menu-item.entity';
import { OrderContainerItemComposer } from './order-container-item.composer';

export class OrderMenuItemComposer extends ComposerBase<OrderMenuItemEntity> {
  constructor(
    private readonly containerItemComposer: OrderContainerItemComposer,
  ) {
    super();
  }
  protected entityClass: EntityTarget<OrderMenuItem>;

  protected async createInTransaction(
    dto: CreateOrderMenuItemDto,
    manager: EntityManager,
  ): Promise<OrderMenuItem> {
    const entity = manager.create(OrderMenuItem, {
      ...(dto.parentOrderId && { order: { id: dto.parentOrderId } }),
      menuItem: { id: dto.menuItemId },
      quantity: dto.quantity,
      size: { id: dto.sizeId },
    });

    const savedResult = await manager.save(entity);

    if (dto.containerOrderMenuItems) {
      savedResult.containerOrderMenuItems =
        await this.containerItemComposer.composeManyNestedEntity(
          dto.containerOrderMenuItems,
          manager,
          [],
          {
            parentOrderMenuItemId: savedResult.id,
            parentMenuItemId: savedResult.menuItem.id,
            parentMenuItemSizeId: savedResult.size.id,
          },
        );
      await manager.save(savedResult);
    }

    return savedResult;
  }
  protected async updateInTransaction(
    dto: UpdateOrderMenuItemDto,
    manager: EntityManager,
    entity: OrderMenuItem,
  ): Promise<void> {
    if (dto.menuItemId !== undefined) {
      entity.menuItem = manager.create(MenuItem, {
        id: dto.menuItemId,
      });
    }

    if (dto.sizeId !== undefined) {
      entity.size = manager.create(MenuItemSize, {
        id: dto.sizeId,
      });
    }

    if (dto.quantity !== undefined) {
      entity.quantity = dto.quantity;
    }

    if (dto.containerOrderMenuItems) {
      const existingItems = await manager.find(OrderContainerItem, {
        where: { parentOrderMenuItem: { id: entity.id } },
      });

      entity.containerOrderMenuItems =
        await this.containerItemComposer.composeManyNestedEntity(
          dto.containerOrderMenuItems,
          manager,
          existingItems,
          {
            parentOrderMenuItemId: entity.id,
            parentMenuItemId: entity.menuItem.id,
            parentMenuItemSizeId: entity.size.id,
          },
        );
    }
    await manager.save(entity);
  }

  protected resolveCreateDto(
    dto: NestedCreateOrderMenuItemDto,
    context?: ResolverContext,
  ): CreateOrderMenuItemDto {
    if (!context?.parentOrderId) {
      throw new Error('Parent order id is required');
    }

    return {
      parentOrderId: context.parentOrderId,
      menuItemId: dto.menuItemId,
      sizeId: dto.sizeId,
      quantity: dto.quantity,
      containerOrderMenuItems: dto.containerOrderMenuItems,
    };
  }
}
