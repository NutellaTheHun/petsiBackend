import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { NestedCreateInventoryItemSizeDto } from '../../dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../../dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { UpdateInventoryItemDto } from '../../dto/inventory-item/update-inventory-item.dto';
import { InventoryItemSize } from '../../entities/inventory-item-size.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { InventoryItemSizeChangeDetector } from './inventory-item-size.change-detector';

type NestedItemSizeDto = NestedCreateInventoryItemSizeDto | NestedUpdateInventoryItemSizeDto;

@Injectable()
export class InventoryItemChangeDetector extends ChangeDetectorBase<
  InventoryItem,
  UpdateInventoryItemDto
> {
  constructor(
    private readonly itemSizeChangeDetector: InventoryItemSizeChangeDetector,
  ) {
    super();
  }

  detect(
    entity: InventoryItem,
    dto: UpdateInventoryItemDto,
  ): ChangeDetectionResult<UpdateInventoryItemDto> {
    const patch: MutablePartial<UpdateInventoryItemDto> = {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(entity.name, dto.name)) {
      patch.name = dto.name;
      changes.push({ op: 'scalar', path: 'name', previousValue: entity.name, nextValue: dto.name });
    }
    if (!this.unchanged(entity.category?.id ?? null, dto.categoryId ?? null)) {
      patch.categoryId = dto.categoryId;
      changes.push({
        op: 'reference',
        path: 'categoryId',
        previousValue: entity.category?.id ?? null,
        nextValue: dto.categoryId ?? null,
      });
    }
    if (!this.unchanged(entity.vendor?.id ?? null, dto.vendorId ?? null)) {
      patch.vendorId = dto.vendorId;
      changes.push({
        op: 'reference',
        path: 'vendorId',
        previousValue: entity.vendor?.id ?? null,
        nextValue: dto.vendorId ?? null,
      });
    }

    const sizePatch = this.detectSizes(entity.sizes ?? [], dto.sizes);
    if (sizePatch.length > 0) {
      patch.sizes = sizePatch;
      changes.push({
        op: 'aggregate',
        path: 'sizes',
        previousValue: entity.sizes?.map((s) => s.id) ?? [],
        nextValue: sizePatch,
      });
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }

  private detectSizes(
    existingSizes: InventoryItemSize[],
    incomingDtos: NestedItemSizeDto[],
  ): NestedItemSizeDto[] {
    const patchDtos: NestedItemSizeDto[] = [];
    const existingById = new Map<number, InventoryItemSize>();
    for (const size of existingSizes) {
      existingById.set(size.id, size);
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
      const child = this.itemSizeChangeDetector.detect(existing, dto);
      if (child.hasChanges) {
        patchDtos.push(child.patch as NestedUpdateInventoryItemSizeDto);
      }
    }

    return patchDtos;
  }
}
