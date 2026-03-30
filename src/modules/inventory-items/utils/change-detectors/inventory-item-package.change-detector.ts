import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { UpdateInventoryItemPackageDto } from '../../dto/inventory-item-package/update-inventory-item-package.dto';
import { InventoryItemPackage } from '../../entities/inventory-item-package.entity';

@Injectable()
export class InventoryItemPackageChangeDetector extends ChangeDetectorBase<
  InventoryItemPackage,
  UpdateInventoryItemPackageDto
> {
  detect(
    entity: InventoryItemPackage,
    dto: UpdateInventoryItemPackageDto,
  ): ChangeDetectionResult<UpdateInventoryItemPackageDto> {
    const patch: MutablePartial<UpdateInventoryItemPackageDto> = {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(entity.name, dto.name)) {
      patch.name = dto.name;
      changes.push({ path: 'name', previousValue: entity.name, nextValue: dto.name });
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }
}
