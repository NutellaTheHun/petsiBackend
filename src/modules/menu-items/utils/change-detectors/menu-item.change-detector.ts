import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { NestedCreateMenuItemContainerItemDto } from '../../dto/menu-item-container-item/nested-create-menu-item-container-item.dto';
import { NestedUpdateMenuItemContainerItemDto } from '../../dto/menu-item-container-item/nested-update-menu-item-container-item.dto';
import { UpdateMenuItemDto } from '../../dto/menu-item/update-menu-item.dto';
import { MenuItemContainerItem } from '../../entities/menu-item-container-item.entity';
import { MenuItem } from '../../entities/menu-item.entity';
import { menuItemContainerItemToNestedUpdateDto } from '../entity-transformers/menu-item-container-item.dto.transfomer';
import { MenuItemContainerItemChangeDetector } from './menu-item-container-item.change-detector';

type NestedContainerItemDto =
  | NestedCreateMenuItemContainerItemDto
  | NestedUpdateMenuItemContainerItemDto;

@Injectable()
export class MenuItemChangeDetector extends ChangeDetectorBase<MenuItem, UpdateMenuItemDto> {
  constructor(
    private readonly containerItemChangeDetector: MenuItemContainerItemChangeDetector,
  ) {
    super();
  }

  detect(entity: MenuItem, dto: UpdateMenuItemDto): ChangeDetectionResult<UpdateMenuItemDto> {
    const patch: MutablePartial<UpdateMenuItemDto> = {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(entity.name, dto.name)) {
      patch.name = dto.name;
      changes.push({ path: 'name', previousValue: entity.name, nextValue: dto.name });
    }
    if (!this.unchanged(entity.type, dto.type)) {
      patch.type = dto.type;
      changes.push({ path: 'type', previousValue: entity.type, nextValue: dto.type });
    }
    if (!this.unchanged(entity.category?.id ?? null, dto.categoryId)) {
      patch.categoryId = dto.categoryId;
      changes.push({
        path: 'categoryId',
        previousValue: entity.category?.id ?? null,
        nextValue: dto.categoryId,
      });
    }

    const existingSizeIds = (entity.sizes ?? []).map((s) => s.id).sort((a, b) => a - b);
    const incomingSizeIds = [...dto.sizeIds].sort((a, b) => a - b);
    if (!this.sameNumberArray(existingSizeIds, incomingSizeIds)) {
      patch.sizeIds = dto.sizeIds;
      changes.push({ path: 'sizeIds', previousValue: existingSizeIds, nextValue: dto.sizeIds });
    }

    if (!this.unchanged(entity.variableMaxAmount ?? null, dto.variableMaxAmount ?? null)) {
      patch.variableMaxAmount = dto.variableMaxAmount ?? null;
      changes.push({
        path: 'variableMaxAmount',
        previousValue: entity.variableMaxAmount ?? null,
        nextValue: dto.variableMaxAmount ?? null,
      });
    }

    if (dto.containerMenuItems !== undefined) {
      const nestedPatch = this.detectContainerItems(
        entity.containerMenuItems ?? [],
        dto.containerMenuItems ?? [],
      );
      if (nestedPatch.length > 0) {
        patch.containerMenuItems = nestedPatch;
        changes.push({
          path: 'containerMenuItems',
          previousValue: entity.containerMenuItems?.map((c) => c.id) ?? [],
          nextValue: nestedPatch,
        });
      }
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }

  private detectContainerItems(
    existingItems: MenuItemContainerItem[],
    incomingDtos: NestedContainerItemDto[],
  ): NestedContainerItemDto[] {
    const patchDtos: NestedContainerItemDto[] = [];
    const existingById = new Map<number, MenuItemContainerItem>();
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
      const child = this.containerItemChangeDetector.detect(
        existing,
        dto,
      );
      if (child.hasChanges) {
        patchDtos.push(child.patch as NestedUpdateMenuItemContainerItemDto);
      }
    }
    return patchDtos;
  }
}
