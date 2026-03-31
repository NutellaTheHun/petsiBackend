import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { NestedUpdateInventoryAreaItemDto } from '../../dto/inventory-area-item/nested-update-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../../dto/inventory-area-item/update-inventory-area-item.dto';
import { InventoryAreaItem } from '../../entities/inventory-area-item.entity';
import { inventoryAreaItemToNestedUpdateDto } from '../entity-transformers/inventory-area-item.dto.transformer';
import { inventoryAreaItemToUpdateDto } from '../entity-transformers/inventory-area-item.dto.transformer';

@Injectable()
export class InventoryAreaItemChangeDetector extends ChangeDetectorBase<
  InventoryAreaItem,
  UpdateInventoryAreaItemDto | NestedUpdateInventoryAreaItemDto
> {
  detect(
    entity: InventoryAreaItem,
    dto: UpdateInventoryAreaItemDto | NestedUpdateInventoryAreaItemDto,
  ): ChangeDetectionResult<UpdateInventoryAreaItemDto | NestedUpdateInventoryAreaItemDto> {
    const existingDto =
      'id' in dto ? inventoryAreaItemToNestedUpdateDto(entity) : inventoryAreaItemToUpdateDto(entity);
    const patch: MutablePartial<UpdateInventoryAreaItemDto | NestedUpdateInventoryAreaItemDto> =
      'id' in dto ? { id: dto.id } : {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(existingDto.countedInventoryItemId, dto.countedInventoryItemId)) {
      patch.countedInventoryItemId = dto.countedInventoryItemId;
      changes.push({
        op: 'reference',
        path: 'countedInventoryItemId',
        previousValue: existingDto.countedInventoryItemId,
        nextValue: dto.countedInventoryItemId,
      });
    }
    if (!this.unchanged(existingDto.amount, dto.amount)) {
      patch.amount = dto.amount;
      changes.push({
        op: 'scalar',
        path: 'amount',
        previousValue: existingDto.amount,
        nextValue: dto.amount,
      });
    }
    if (!this.unchanged(existingDto.countedItemSizeId ?? null, dto.countedItemSizeId ?? null)) {
      patch.countedItemSizeId = dto.countedItemSizeId;
      changes.push({
        op: 'reference',
        path: 'countedItemSizeId',
        previousValue: existingDto.countedItemSizeId ?? null,
        nextValue: dto.countedItemSizeId ?? null,
      });
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }
}
