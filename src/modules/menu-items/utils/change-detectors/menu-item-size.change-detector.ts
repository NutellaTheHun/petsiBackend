import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { UpdateMenuItemSizeDto } from '../../dto/menu-item-size/update-menu-item-size.dto';
import { MenuItemSize } from '../../entities/menu-item-size.entity';

@Injectable()
export class MenuItemSizeChangeDetector extends ChangeDetectorBase<
  MenuItemSize,
  UpdateMenuItemSizeDto
> {
  detect(
    entity: MenuItemSize,
    dto: UpdateMenuItemSizeDto,
  ): ChangeDetectionResult<UpdateMenuItemSizeDto> {
    const patch: MutablePartial<UpdateMenuItemSizeDto> = {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(entity.name, dto.name)) {
      patch.name = dto.name;
      changes.push({ path: 'name', previousValue: entity.name, nextValue: dto.name });
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }
}
