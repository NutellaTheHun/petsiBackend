import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { NestedUpdateTemplateMenuItemDto } from '../../dto/template-menu-item/nested-update-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../../dto/template-menu-item/update-template-menu-item.dto';
import { TemplateMenuItem } from '../../entities/template-menu-item.entity';
import { templateMenuItemToNestedUpdateDto, templateMenuItemToUpdateDto } from '../entity-transformers/template-menu-item.dto.transformer';

@Injectable()
export class TemplateMenuItemChangeDetector extends ChangeDetectorBase<
  TemplateMenuItem,
  UpdateTemplateMenuItemDto | NestedUpdateTemplateMenuItemDto
> {
  detect(
    entity: TemplateMenuItem,
    dto: UpdateTemplateMenuItemDto | NestedUpdateTemplateMenuItemDto,
  ): ChangeDetectionResult<UpdateTemplateMenuItemDto | NestedUpdateTemplateMenuItemDto> {
    const existing =
      'id' in dto ? templateMenuItemToNestedUpdateDto(entity) : templateMenuItemToUpdateDto(entity);
    const patch: MutablePartial<UpdateTemplateMenuItemDto | NestedUpdateTemplateMenuItemDto> =
      'id' in dto ? { id: dto.id } : {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(existing.displayName, dto.displayName)) {
      patch.displayName = dto.displayName;
      changes.push({
        op: 'scalar',
        path: 'displayName',
        previousValue: existing.displayName,
        nextValue: dto.displayName,
      });
    }
    if (!this.unchanged(existing.tablePosIndex, dto.tablePosIndex)) {
      patch.tablePosIndex = dto.tablePosIndex;
      changes.push({
        op: 'scalar',
        path: 'tablePosIndex',
        previousValue: existing.tablePosIndex,
        nextValue: dto.tablePosIndex,
      });
    }
    if (!this.unchanged(existing.menuItemId, dto.menuItemId)) {
      patch.menuItemId = dto.menuItemId;
      changes.push({
        op: 'reference',
        path: 'menuItemId',
        previousValue: existing.menuItemId,
        nextValue: dto.menuItemId,
      });
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }
}
