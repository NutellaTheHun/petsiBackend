import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ComposerBase } from '../../../../common/base/composer.base';
import { ResolverContext } from '../../../../common/types/resolver-context.type';
import { CreateInventoryItemSizeDto } from '../../dto/inventory-item-size/create-inventory-item-size.dto';
import { NestedCreateInventoryItemSizeDto } from '../../dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../../dto/inventory-item-size/update-inventory-item-size.dto';
import { InventoryItemPackage } from '../../entities/inventory-item-package.entity';
import {
    InventoryItemSize,
    InventoryItemSizeEntity,
} from '../../entities/inventory-item-size.entity';

@Injectable()
export class InventoryItemSizeComposer extends ComposerBase<InventoryItemSizeEntity> {
    protected readonly entityClass = InventoryItemSize;

    protected async createInTransaction(
        dto: CreateInventoryItemSizeDto,
        manager: EntityManager,
    ): Promise<InventoryItemSize> {
        const result = manager.create(InventoryItemSize, {
            measureAmount: dto.measureAmount,
            unit: dto.unit,
            package: { id: dto.packageId },
            inventoryItem: { id: dto.inventoryItemId },
            cost: dto.cost ? dto.cost.toString() : null,
        });
        return result;
    }

    protected async updateInTransaction(
        dto: UpdateInventoryItemSizeDto,
        manager: EntityManager,
        entity: InventoryItemSize,
    ): Promise<void> {
        if (dto.cost !== undefined) {
            entity.cost = dto.cost ? dto.cost.toString() : null;
        }

        if (dto.packageId !== undefined) {
            entity.package = manager.create(InventoryItemPackage, {
                id: dto.packageId,
            });
        }

        if (dto.measureAmount !== undefined) {
            entity.measureAmount = dto.measureAmount;
        }

        if (dto.unit !== undefined) {
            entity.unit = dto.unit;
        }
    }

    protected resolveCreateDto(
        dto: NestedCreateInventoryItemSizeDto,
        context?: ResolverContext,
    ): CreateInventoryItemSizeDto {
        if (!context?.inventoryItemId) {
            throw new Error(
                'InventoryItemSizeResolver: inventoryItemId is required in context',
            );
        }

        return {
            packageId: dto.packageId,
            unit: dto.unit,
            measureAmount: dto.measureAmount,
            cost: dto.cost,
            inventoryItemId: context.inventoryItemId,
        };
    }
}
