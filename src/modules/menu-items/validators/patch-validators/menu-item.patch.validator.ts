import { AggregatePatchValidatorBase } from '../../../../common/base/aggregate-patch-validator.base';
import { MenuItemContainerItemEntity } from '../../entities/menu-item-container-item.entity';

/*type MenuItemContainerItemIdentity = {
  containedMenuItemId: number;
  containedItemSizeId: number;
};*/

export class MenuItemContainerItemPatchValidator extends AggregatePatchValidatorBase<MenuItemContainerItemEntity> {
  protected entityKey(entity: MenuItemContainerItemEntity['__Entity']): string {
    return this.entityContainerItemKey(entity);
  }
  protected createDtoKey(dto: MenuItemContainerItemEntity['__NcDto']): string {
    return this.dtoContainerItemKey(dto);
  }
  protected applyUpdateKey(
    entity: MenuItemContainerItemEntity['__Entity'],
    dto: MenuItemContainerItemEntity['__NuDto'],
  ): string {
    return this.entityContainerItemKey({
      containedMenuItem: dto.containedMenuItemId
        ? { id: dto.containedMenuItemId }
        : entity.containedMenuItem,
      containedItemSize: dto.containedItemSizeId
        ? { id: dto.containedItemSizeId }
        : entity.containedItemSize,
    } as any);
  }

  // Helpers

  private entityContainerItemKey(
    entity: MenuItemContainerItemEntity['__Entity'],
  ): string {
    return `${entity.containedMenuItem.id}:${entity.containedItemSize.id}`;
  }

  private dtoContainerItemKey(
    dto: MenuItemContainerItemEntity['__NcDto'],
  ): string {
    return `${dto.containedMenuItemId}:${dto.containedItemSizeId}`;
  }
  /*
  private entityContainerItemToIdentity(
    entity: MenuItemContainerItemEntity['__Entity'],
  ): MenuItemContainerItemIdentity {
    return {
      containedMenuItemId: entity.containedMenuItem.id,
      containedItemSizeId: entity.containedItemSize.id,
    };
  }
  private dtoContainerItemToIdentity(
    dto: MenuItemContainerItemEntity['__NcDto'],
  ): MenuItemContainerItemIdentity {
    return {
      containedMenuItemId: dto.containedMenuItemId,
      containedItemSizeId: dto.containedItemSizeId,
    };
  }*/
}
