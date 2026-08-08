import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { UpdateInventoryAreaDto } from '../../dto/inventory-area/update-inventory-area.dto';
import { InventoryArea } from '../../entities/inventory-area.entity';

@Injectable()
export class InventoryAreaChangeDetector extends ChangeDetectorBase<
  InventoryArea,
  UpdateInventoryAreaDto
> {
  detect(
    entity: InventoryArea,
    dto: UpdateInventoryAreaDto,
  ): ChangeDetectionResult<UpdateInventoryAreaDto> {
    const patch: MutablePartial<UpdateInventoryAreaDto> = {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(entity.name, dto.name)) {
      patch.name = dto.name;
      changes.push({ op: 'scalar', path: 'name', previousValue: entity.name, nextValue: dto.name });
    }

    if (!this.unchanged(entity.locationId, dto.locationId)) {
      patch.locationId = dto.locationId;
      changes.push({ op: 'reference', path: 'locationId', previousValue: entity.locationId, nextValue: dto.locationId });
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }
}
