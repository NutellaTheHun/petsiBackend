import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { UpdateInventoryItemCategoryDto } from '../../dto/inventory-item-category/update-inventory-item-category.dto';
import { InventoryItemCategory } from '../../entities/inventory-item-category.entity';

@Injectable()
export class InventoryItemCategoryChangeDetector extends ChangeDetectorBase<
  InventoryItemCategory,
  UpdateInventoryItemCategoryDto
> {
  detect(
    entity: InventoryItemCategory,
    dto: UpdateInventoryItemCategoryDto,
  ): ChangeDetectionResult<UpdateInventoryItemCategoryDto> {
    const patch: MutablePartial<UpdateInventoryItemCategoryDto> = {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(entity.name, dto.name)) {
      patch.name = dto.name;
      changes.push({ op: 'scalar', path: 'name', previousValue: entity.name, nextValue: dto.name });
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }
}
