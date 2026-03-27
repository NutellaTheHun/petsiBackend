import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { NestedUpdateMenuItemContainerItemDto } from '../../dto/menu-item-container-item/nested-update-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../../dto/menu-item-container-item/update-menu-item-container-item.dto';
import { MenuItemContainerItem } from '../../entities/menu-item-container-item.entity';
import { menuItemContainerItemToNestedUpdateDto } from '../entity-transformers/menu-item-container-item.dto.transfomer';
import { menuItemContainerItemToUpdateDto } from '../entity-transformers/menu-item-container-item.dto.transfomer';

@Injectable()
export class MenuItemContainerItemChangeDetector extends ChangeDetectorBase<
  MenuItemContainerItem,
  UpdateMenuItemContainerItemDto | NestedUpdateMenuItemContainerItemDto
> {
  detect(
    entity: MenuItemContainerItem,
    dto: UpdateMenuItemContainerItemDto | NestedUpdateMenuItemContainerItemDto,
  ): ChangeDetectionResult<UpdateMenuItemContainerItemDto | NestedUpdateMenuItemContainerItemDto> {
    const existingDto =
      'id' in dto
        ? menuItemContainerItemToNestedUpdateDto(entity)
        : menuItemContainerItemToUpdateDto(entity);
    const patch: MutablePartial<UpdateMenuItemContainerItemDto | NestedUpdateMenuItemContainerItemDto> =
      'id' in dto ? { id: dto.id } : {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(existingDto.containedMenuItemId, dto.containedMenuItemId)) {
      patch.containedMenuItemId = dto.containedMenuItemId;
      changes.push({
        path: 'containedMenuItemId',
        previousValue: existingDto.containedMenuItemId,
        nextValue: dto.containedMenuItemId,
      });
    }
    if (!this.unchanged(existingDto.containedItemSizeId, dto.containedItemSizeId)) {
      patch.containedItemSizeId = dto.containedItemSizeId;
      changes.push({
        path: 'containedItemSizeId',
        previousValue: existingDto.containedItemSizeId,
        nextValue: dto.containedItemSizeId,
      });
    }
    if (!this.unchanged(existingDto.quantity, dto.quantity)) {
      patch.quantity = dto.quantity;
      changes.push({
        path: 'quantity',
        previousValue: existingDto.quantity,
        nextValue: dto.quantity,
      });
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }
}
