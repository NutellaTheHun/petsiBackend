import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { NestedCreateTemplateMenuItemDto } from '../../dto/template-menu-item/nested-create-template-menu-item.dto';
import { NestedUpdateTemplateMenuItemDto } from '../../dto/template-menu-item/nested-update-template-menu-item.dto';
import { UpdateTemplateDto } from '../../dto/template/update-template.dto';
import { TemplateMenuItem } from '../../entities/template-menu-item.entity';
import { Template } from '../../entities/template.entity';
import { TemplateMenuItemChangeDetector } from './template-menu-item.change-detector';

type NestedTemplateMenuItemDto =
  | NestedCreateTemplateMenuItemDto
  | NestedUpdateTemplateMenuItemDto;

@Injectable()
export class TemplateChangeDetector extends ChangeDetectorBase<Template, UpdateTemplateDto> {
  constructor(
    private readonly templateMenuItemChangeDetector: TemplateMenuItemChangeDetector,
  ) {
    super();
  }

  detect(entity: Template, dto: UpdateTemplateDto): ChangeDetectionResult<UpdateTemplateDto> {
    const patch: MutablePartial<UpdateTemplateDto> = {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(entity.name, dto.name)) {
      patch.name = dto.name;
      changes.push({ path: 'name', previousValue: entity.name, nextValue: dto.name });
    }

    const menuItemsPatch = this.detectTemplateMenuItems(entity.templateMenuItems ?? [], dto.templateMenuItems);
    if (menuItemsPatch.length > 0) {
      patch.templateMenuItems = menuItemsPatch;
      changes.push({
        path: 'templateMenuItems',
        previousValue: entity.templateMenuItems?.map((item) => item.id) ?? [],
        nextValue: menuItemsPatch,
      });
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }

  private detectTemplateMenuItems(
    existingItems: TemplateMenuItem[],
    incomingDtos: NestedTemplateMenuItemDto[],
  ): NestedTemplateMenuItemDto[] {
    const patchDtos: NestedTemplateMenuItemDto[] = [];
    const existingById = new Map<number, TemplateMenuItem>();
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
      const child = this.templateMenuItemChangeDetector.detect(existing, dto);
      if (child.hasChanges) {
        patchDtos.push(child.patch as NestedUpdateTemplateMenuItemDto);
      }
    }

    return patchDtos;
  }
}
