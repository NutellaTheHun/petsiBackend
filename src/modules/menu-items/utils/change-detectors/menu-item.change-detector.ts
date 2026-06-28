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
import { MenuItemDynamicPropertyValue } from '../../entities/menu-item-dynamic-property-value.entity';
import { MenuItem } from '../../entities/menu-item.entity';
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
      changes.push({ op: 'scalar', path: 'name', previousValue: entity.name, nextValue: dto.name });
    }
    if (!this.unchanged(entity.type, dto.type)) {
      patch.type = dto.type;
      changes.push({ op: 'scalar', path: 'type', previousValue: entity.type, nextValue: dto.type });
    }
    if (!this.unchanged(entity.category?.id ?? null, dto.categoryId)) {
      patch.categoryId = dto.categoryId;
      changes.push({
        op: 'reference',
        path: 'categoryId',
        previousValue: entity.category?.id ?? null,
        nextValue: dto.categoryId,
      });
    }

    if (dto.sizeIds !== undefined) {
      const existingSizeIds = (entity.sizes ?? []).map((s) => s.id).sort((a, b) => a - b);
      const incomingSizeIds = [...dto.sizeIds].sort((a, b) => a - b);
      if (!this.sameNumberArray(existingSizeIds, incomingSizeIds)) {
        patch.sizeIds = dto.sizeIds;
        changes.push({
          op: 'aggregate',
          path: 'sizeIds',
          previousValue: existingSizeIds,
          nextValue: dto.sizeIds,
        });
      }
    }

    if (!this.unchanged(entity.variableMaxAmount ?? null, dto.variableMaxAmount ?? null)) {
      patch.variableMaxAmount = dto.variableMaxAmount ?? null;
      changes.push({
        op: 'scalar',
        path: 'variableMaxAmount',
        previousValue: entity.variableMaxAmount ?? null,
        nextValue: dto.variableMaxAmount ?? null,
      });
    }

    if (dto.containerMenuItems !== undefined) {
      const containerPatch = this.detectContainerItems(
        entity.containerMenuItems ?? [],
        dto.containerMenuItems ?? [],
      );
      if (containerPatch !== undefined) {
        patch.containerMenuItems = containerPatch;
        changes.push({
          op: 'aggregate',
          path: 'containerMenuItems',
          previousValue: entity.containerMenuItems?.map((c) => c.id) ?? [],
          nextValue: containerPatch,
        });
      }
    }

    if (dto.dynamicProperties !== undefined) {
      if (this.hasDynamicPropertyChanges(entity.dynamicPropertyValues ?? [], dto.dynamicProperties)) {
        patch.dynamicProperties = dto.dynamicProperties;
        changes.push({
          op: 'aggregate',
          path: 'dynamicProperties',
          previousValue: (entity.dynamicPropertyValues ?? []).map((dpv) => ({
            configId: dpv.config.id,
            valueText: dpv.valueText,
            valueEntityId: dpv.valueEntityId ?? null,
          })),
          nextValue: dto.dynamicProperties,
        });
      }
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }

  private hasDynamicPropertyChanges(
    existing: MenuItemDynamicPropertyValue[],
    incoming: { configId: number; value: string | null }[],
  ): boolean {
    const existingByConfigId = new Map(
      existing.map((dpv) => [
        dpv.config.id,
        dpv.valueText ?? (dpv.valueEntityId != null ? String(dpv.valueEntityId) : null),
      ]),
    );

    for (const dp of incoming) {
      const currentValue = existingByConfigId.get(dp.configId);
      if (dp.value === null) {
        if (currentValue !== undefined) return true;
      } else {
        if (currentValue !== dp.value) return true;
      }
    }

    return false;
  }

  /**
   * When `incoming` is empty and existing empty, no change.
   * Otherwise authoritative full list when structural or any line differs.
   */
  private detectContainerItems(
    existingItems: MenuItemContainerItem[],
    incoming: NestedContainerItemDto[],
  ): NestedContainerItemDto[] | undefined {
    if (incoming.length === 0 && existingItems.length === 0) {
      return undefined;
    }

    const existingById = new Map<number, MenuItemContainerItem>();
    for (const item of existingItems) {
      existingById.set(item.id, item);
    }

    const prevIds = existingItems.map((i) => i.id);
    const nextIdSet = new Set(
      incoming
        .filter((d): d is NestedUpdateMenuItemContainerItemDto => 'id' in d)
        .map((d) => d.id),
    );
    const removed = prevIds.some((id) => !nextIdSet.has(id));
    const added = incoming.some((d) => 'createId' in d);

    let needsFullReplace = removed || added;
    if (!needsFullReplace) {
      for (const itemDto of incoming) {
        if ('createId' in itemDto) {
          needsFullReplace = true;
          break;
        }
        const existing = existingById.get(itemDto.id);
        if (!existing) {
          needsFullReplace = true;
          break;
        }
        const child = this.containerItemChangeDetector.detect(existing, itemDto);
        if (child.hasChanges) {
          needsFullReplace = true;
          break;
        }
      }
    }

    if (!needsFullReplace) {
      return undefined;
    }

    return incoming;
  }
}
