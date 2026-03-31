import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { UpdateMenuItemCategoryDto } from '../../dto/menu-item-category/update-menu-item-category.dto';
import { MenuItemCategory } from '../../entities/menu-item-category.entity';

@Injectable()
export class MenuItemCategoryChangeDetector extends ChangeDetectorBase<
  MenuItemCategory,
  UpdateMenuItemCategoryDto
> {
  detect(
    entity: MenuItemCategory,
    dto: UpdateMenuItemCategoryDto,
  ): ChangeDetectionResult<UpdateMenuItemCategoryDto> {
    const patch: MutablePartial<UpdateMenuItemCategoryDto> = {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(entity.name, dto.name)) {
      patch.name = dto.name;
      changes.push({ op: 'scalar', path: 'name', previousValue: entity.name, nextValue: dto.name });
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }
}
