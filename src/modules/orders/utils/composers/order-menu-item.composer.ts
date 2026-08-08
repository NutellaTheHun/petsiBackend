import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ComposerBase } from '../../../../common/base/composer.base';
import { ResolverContext } from '../../../../common/types/resolver-context.type';
import { MenuItemSize } from '../../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { CreateOrderMenuItemDto } from '../../dto/order-menu-item/create-order-menu-item.dto';
import { NestedCreateOrderMenuItemDto } from '../../dto/order-menu-item/nested-create-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../../dto/order-menu-item/update-order-menu-item.dto';
import {
    OrderMenuItem,
    OrderMenuItemEntity,
} from '../../entities/order-menu-item.entity';
import { OrderContainerItemComposer } from './order-container-item.composer';

@Injectable()
export class OrderMenuItemComposer extends ComposerBase<OrderMenuItemEntity> {
    protected readonly entityClass = OrderMenuItem;

    constructor(
        private readonly containerItemComposer: OrderContainerItemComposer,
    ) {
        super();
    }

    protected async createInTransaction(
        dto: CreateOrderMenuItemDto,
        manager: EntityManager,
    ): Promise<OrderMenuItem> {
        const entity = manager.create(OrderMenuItem, {
            parentOrder: { id: dto.parentOrderId },
            menuItem: { id: dto.menuItemId },
            quantity: dto.quantity,
            size: { id: dto.sizeId },
            tenantId: dto.tenantId,
            locationId: dto.locationId,
        });

        const savedResult = await manager.save(entity);
        if (dto.containerOrderMenuItems && dto.containerOrderMenuItems.length > 0) {
            savedResult.containerOrderMenuItems =
                await this.containerItemComposer.composeManyNestedEntity(
                    dto.containerOrderMenuItems,
                    manager,
                    [],
                    {
                        parentOrderMenuItemId: savedResult.id,
                        parentMenuItemId: savedResult.menuItem.id,
                        parentMenuItemSizeId: savedResult.size?.id,
                        tenantId: savedResult.tenantId,
                        locationId: savedResult.locationId,
                    },
                );
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
            entity.containerOrderMenuItems =
                await this.containerItemComposer.composeManyNestedEntity(
                    dto.containerOrderMenuItems,
                    manager,
                    entity.containerOrderMenuItems ?? [],
                    {
                        parentOrderMenuItemId: entity.id,
                        parentMenuItemId: entity.menuItem.id,
                        parentMenuItemSizeId: entity.size?.id,
                        tenantId: entity.tenantId,
                        locationId: entity.locationId,
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
        if (context.tenantId == null || context.locationId == null) {
            throw new Error('tenantId/locationId are required in context');
        }

        return {
            parentOrderId: context.parentOrderId,
            menuItemId: dto.menuItemId,
            sizeId: dto.sizeId,
            quantity: dto.quantity,
            containerOrderMenuItems: dto.containerOrderMenuItems,
            tenantId: context.tenantId,
            locationId: context.locationId,
        };
    }
}
