import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ComposerBase } from '../../../../common/base/composer.base';
import { ResolverContext } from '../../../../common/types/resolver-context.type';
import { InventoryItemSize } from '../../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';
import { InventoryItemSizeComposer } from '../../../inventory-items/utils/composers/inventory-item-size.composer';
import { CreateInventoryAreaItemDto } from '../../dto/inventory-area-item/create-inventory-area-item.dto';
import { NestedCreateInventoryAreaItemDto } from '../../dto/inventory-area-item/nested-create-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../../dto/inventory-area-item/update-inventory-area-item.dto';
import {
    InventoryAreaItem,
    InventoryAreaItemEntity,
} from '../../entities/inventory-area-item.entity';

@Injectable()
export class InventoryAreaItemComposer extends ComposerBase<InventoryAreaItemEntity> {
    constructor(private readonly itemSizeResolver: InventoryItemSizeComposer) {
        super();
    }

    protected readonly entityClass = InventoryAreaItem;

    protected async createInTransaction(
        dto: CreateInventoryAreaItemDto,
        manager: EntityManager,
    ): Promise<InventoryAreaItem> {
        let countedItemSize: InventoryItemSize;

        if (dto.countedItemSizeId) {
            countedItemSize = manager.create(InventoryItemSize, {
                id: dto.countedItemSizeId,
            });
        } else if (dto.countedItemSize) {
            countedItemSize = await this.itemSizeResolver.composeNestedEntity(
                dto.countedItemSize,
                manager,
                { inventoryItemId: dto.countedInventoryItemId },
            );
        } else {
            throw new Error('countedItemSize or countedItemSizeDto is required');
        }

        return manager.create(InventoryAreaItem, {
            parentInventoryCount: { id: dto.parentInventoryCountId },
            countedInventoryItem: { id: dto.countedInventoryItemId },
            amount: dto.amount,
            countedItemSize,
        });
    }

    protected async updateInTransaction(
        dto: UpdateInventoryAreaItemDto,
        manager: EntityManager,
        entity: InventoryAreaItem,
    ): Promise<void> {
        if (dto.amount !== undefined) {
            entity.amount = dto.amount;
        }

        if (dto.countedInventoryItemId !== undefined) {
            entity.countedInventoryItem = manager.create(InventoryItem, {
                id: dto.countedInventoryItemId,
            });
        }

        if (dto.countedItemSize && dto.countedItemSizeId) {
            throw new Error(
                'Provide either countedItemSizeId OR countedItemSizeDto, not both.',
            );
        }

        if (dto.countedItemSize !== undefined) {
            const itemSize = await this.itemSizeResolver.composeNestedEntity(
                dto.countedItemSize,
                manager,
            );
            entity.countedItemSize = itemSize;
        }

        if (dto.countedItemSizeId !== undefined) {
            entity.countedItemSize = manager.create(InventoryItemSize, {
                id: dto.countedItemSizeId,
            });
        }
    }

    protected resolveCreateDto(
        dto: NestedCreateInventoryAreaItemDto,
        context?: ResolverContext,
    ): CreateInventoryAreaItemDto {
        if (!context?.parentInventoryCountId) {
            throw new Error(
                'InventoryAreaItemResolver: parentInventoryCountId is required in context',
            );
        }

        return {
            countedInventoryItemId: dto.countedInventoryItemId,
            amount: dto.amount,
            countedItemSizeId: dto.countedItemSizeId,
            countedItemSize: dto.countedItemSize,
            parentInventoryCountId: context.parentInventoryCountId,
        };
    }
}
