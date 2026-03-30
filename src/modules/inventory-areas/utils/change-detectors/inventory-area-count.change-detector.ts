import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { NestedCreateInventoryAreaItemDto } from '../../dto/inventory-area-item/nested-create-inventory-area-item.dto';
import { NestedUpdateInventoryAreaItemDto } from '../../dto/inventory-area-item/nested-update-inventory-area-item.dto';
import { UpdateInventoryAreaCountDto } from '../../dto/inventory-area-count/update-inventory-area-count.dto';
import { InventoryAreaItem } from '../../entities/inventory-area-item.entity';
import { InventoryAreaCount } from '../../entities/inventory-area-count.entity';
import { InventoryAreaItemChangeDetector } from './inventory-area-item.change-detector';

type NestedCountItemDto = NestedCreateInventoryAreaItemDto | NestedUpdateInventoryAreaItemDto;

@Injectable()
export class InventoryAreaCountChangeDetector extends ChangeDetectorBase<
  InventoryAreaCount,
  UpdateInventoryAreaCountDto
> {
  constructor(
    private readonly areaItemChangeDetector: InventoryAreaItemChangeDetector,
  ) {
    super();
  }

  detect(
    entity: InventoryAreaCount,
    dto: UpdateInventoryAreaCountDto,
  ): ChangeDetectionResult<UpdateInventoryAreaCountDto> {
    const patch: MutablePartial<UpdateInventoryAreaCountDto> = {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(entity.inventoryArea?.id, dto.inventoryAreaId)) {
      patch.inventoryAreaId = dto.inventoryAreaId;
      changes.push({
        path: 'inventoryAreaId',
        previousValue: entity.inventoryArea?.id,
        nextValue: dto.inventoryAreaId,
      });
    }

    if (dto.countedInventoryItems !== undefined) {
      const countedItemsPatch = this.detectCountedItems(
        entity.countedInventoryItems ?? [],
        dto.countedInventoryItems,
      );
      if (countedItemsPatch.length > 0) {
        patch.countedInventoryItems = countedItemsPatch;
        changes.push({
          path: 'countedInventoryItems',
          previousValue: entity.countedInventoryItems?.map((i) => i.id) ?? [],
          nextValue: countedItemsPatch,
        });
      }
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }

  private detectCountedItems(
    existingItems: InventoryAreaItem[],
    incomingDtos: NestedCountItemDto[],
  ): NestedCountItemDto[] {
    const patchDtos: NestedCountItemDto[] = [];
    const existingById = new Map<number, InventoryAreaItem>();
    for (const item of existingItems) {
      existingById.set(item.id, item);
    }

    for (const dto of incomingDtos) {
      if ('createId' in dto) {
        patchDtos.push(dto);
        continue;
      }
      const existing = existingById.get(dto.id);
      if (!existing) {
        patchDtos.push(dto);
        continue;
      }
      const child = this.areaItemChangeDetector.detect(existing, dto);
      if (child.hasChanges) {
        patchDtos.push(child.patch as NestedUpdateInventoryAreaItemDto);
      }
    }
    return patchDtos;
  }
}
