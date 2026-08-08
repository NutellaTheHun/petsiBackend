import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ComposerBase } from '../../../../common/base/composer.base';
import { ResolverContext } from '../../../../common/types/resolver-context.type';
import { MenuItemSize } from '../../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { CreateOrderContainerItemDto } from '../../dto/order-container-item/create-order-container-item.dto';
import { NestedCreateOrderContainerItemDto } from '../../dto/order-container-item/nested-create-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../../dto/order-container-item/update-order-container-item.dto';
import {
    OrderContainerItem,
    OrderContainerItemEntity,
} from '../../entities/order-container-item.entity';

@Injectable()
export class OrderContainerItemComposer extends ComposerBase<OrderContainerItemEntity> {
    protected readonly entityClass = OrderContainerItem;

    protected async createInTransaction(
        dto: CreateOrderContainerItemDto,
        manager: EntityManager,
    ): Promise<OrderContainerItem> {
        const result = await manager.create(OrderContainerItem, {
            parentOrderMenuItem: { id: dto.parentOrderMenuItemId },
            containedMenuItem: { id: dto.containedMenuItemId },
            containedItemSize: { id: dto.containedItemSizeId },
            quantity: dto.quantity,
            tenantId: dto.tenantId,
            locationId: dto.locationId,
        });
        return result;
    }

    protected async updateInTransaction(
        dto: UpdateOrderContainerItemDto,
        manager: EntityManager,
        entity: OrderContainerItem,
    ): Promise<void> {
        if (dto.containedMenuItemId !== undefined) {
            entity.containedMenuItem = manager.create(MenuItem, {
                id: dto.containedMenuItemId,
            });
        }

        if (dto.containedItemSizeId !== undefined) {
            entity.containedItemSize = manager.create(MenuItemSize, {
                id: dto.containedItemSizeId,
            });
        }

        if (dto.quantity !== undefined) {
            entity.quantity = dto.quantity;
        }
    }

    protected resolveCreateDto(
        dto: NestedCreateOrderContainerItemDto,
        context?: ResolverContext,
    ): CreateOrderContainerItemDto {
        if (!context?.parentOrderMenuItemId) {
            throw new Error('Parent order menu item id is required');
        }
        if (!context?.parentMenuItemId) {
            throw new Error('Parent menu item id is required');
        }
        if (!context?.parentMenuItemSizeId) {
            throw new Error('Parent menu item size id is required');
        }
        if (context.tenantId == null || context.locationId == null) {
            throw new Error('tenantId/locationId are required in context');
        }

        return {
            containedMenuItemId: dto.containedMenuItemId,
            containedItemSizeId: dto.containedItemSizeId,
            quantity: dto.quantity,
            parentOrderMenuItemId: context.parentOrderMenuItemId,
            tenantId: context.tenantId,
            locationId: context.locationId,
        };
    }
}
