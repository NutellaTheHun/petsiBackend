import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { NestedUpdateInventoryItemSizeDto } from '../../dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../../dto/inventory-item-size/update-inventory-item-size.dto';
import { InventoryItemSize } from '../../entities/inventory-item-size.entity';
import { inventoryItemSizeToNestedUpdateDto } from '../entity-transformers/inventory-item-size.dto.transformer';
import { inventoryItemSizeToUpdateDto } from '../entity-transformers/inventory-item-size.dto.transformer';

@Injectable()
export class InventoryItemSizeChangeDetector extends ChangeDetectorBase<
  InventoryItemSize,
  UpdateInventoryItemSizeDto | NestedUpdateInventoryItemSizeDto
> {
  detect(
    entity: InventoryItemSize,
    dto: UpdateInventoryItemSizeDto | NestedUpdateInventoryItemSizeDto,
  ): ChangeDetectionResult<UpdateInventoryItemSizeDto | NestedUpdateInventoryItemSizeDto> {
    const existingDto =
      'id' in dto ? inventoryItemSizeToNestedUpdateDto(entity) : inventoryItemSizeToUpdateDto(entity);
    const patch: MutablePartial<UpdateInventoryItemSizeDto | NestedUpdateInventoryItemSizeDto> =
      'id' in dto ? { id: dto.id } : {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(existingDto.packageId, dto.packageId)) {
      patch.packageId = dto.packageId;
      changes.push({
        op: 'reference',
        path: 'packageId',
        previousValue: existingDto.packageId,
        nextValue: dto.packageId,
      });
    }
    if (!this.unchanged(existingDto.unit, dto.unit)) {
      patch.unit = dto.unit;
      changes.push({
        op: 'scalar',
        path: 'unit',
        previousValue: existingDto.unit,
        nextValue: dto.unit,
      });
    }
    if (!this.unchanged(existingDto.measureAmount, dto.measureAmount)) {
      patch.measureAmount = dto.measureAmount;
      changes.push({
        op: 'scalar',
        path: 'measureAmount',
        previousValue: existingDto.measureAmount,
        nextValue: dto.measureAmount,
      });
    }
    if (!this.unchanged(existingDto.cost ?? null, dto.cost ?? null)) {
      patch.cost = dto.cost;
      changes.push({
        op: 'scalar',
        path: 'cost',
        previousValue: existingDto.cost ?? null,
        nextValue: dto.cost ?? null,
      });
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }
}
