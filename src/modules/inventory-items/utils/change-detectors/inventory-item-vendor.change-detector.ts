import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { UpdateInventoryItemVendorDto } from '../../dto/inventory-item-vendor/update-inventory-item-vendor.dto';
import { InventoryItemVendor } from '../../entities/inventory-item-vendor.entity';

@Injectable()
export class InventoryItemVendorChangeDetector extends ChangeDetectorBase<
  InventoryItemVendor,
  UpdateInventoryItemVendorDto
> {
  detect(
    entity: InventoryItemVendor,
    dto: UpdateInventoryItemVendorDto,
  ): ChangeDetectionResult<UpdateInventoryItemVendorDto> {
    const patch: MutablePartial<UpdateInventoryItemVendorDto> = {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(entity.name, dto.name)) {
      patch.name = dto.name;
      changes.push({ op: 'scalar', path: 'name', previousValue: entity.name, nextValue: dto.name });
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }
}
