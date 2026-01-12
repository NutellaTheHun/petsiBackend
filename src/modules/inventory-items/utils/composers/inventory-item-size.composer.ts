import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ComposerBase } from '../../../../common/base/composer.base';
import { CreateInventoryItemSizeDto } from '../../dto/inventory-item-size/create-inventory-item-size.dto';
import { NestedCreateInventoryItemSizeDto } from '../../dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../../dto/inventory-item-size/update-inventory-item-size.dto';
import {
  InventoryItemSize,
  InventoryItemSizeEntity,
} from '../../entities/inventory-item-size.entity';
import { InventoryItemSizeCreateInTransaction } from '../transactions/inventory-item-size.create.transaction';
import { InventoryItemSizeUpdateInTransaction } from '../transactions/inventory-item-size.update.transaction';

@Injectable()
export class InventoryItemSizeComposer extends ComposerBase<InventoryItemSizeEntity> {
  protected readonly entityClass = InventoryItemSize;

  protected createInTransaction(
    dto: CreateInventoryItemSizeDto,
    manager: EntityManager,
  ): Promise<InventoryItemSize> {
    return InventoryItemSizeCreateInTransaction(dto, manager);
  }
  protected updateInTransaction(
    dto: UpdateInventoryItemSizeDto,
    manager: EntityManager,
    entity: InventoryItemSize,
  ): Promise<void> {
    return InventoryItemSizeUpdateInTransaction(dto, manager, entity);
  }
  protected resolveCreateDto(
    dto: NestedCreateInventoryItemSizeDto,
    context?: ResolverContext,
  ): CreateInventoryItemSizeDto {
    if (!context?.inventoryItemId) {
      throw new Error(
        'InventoryItemSizeResolver: parentSizeId is required in context',
      );
    }

    return {
      packageId: dto.packageId,
      measureTypeId: dto.measureTypeId,
      measureAmount: dto.measureAmount,
      cost: dto.cost,
      inventoryItemId: context.inventoryItemId,
    };
  }
}
