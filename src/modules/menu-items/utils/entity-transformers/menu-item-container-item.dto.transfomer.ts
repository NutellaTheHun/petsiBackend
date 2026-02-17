import { NestedUpdateMenuItemContainerItemDto } from "../../dto/menu-item-container-item/nested-update-menu-item-container-item.dto";
import { UpdateMenuItemContainerItemDto } from "../../dto/menu-item-container-item/update-menu-item-container-item.dto";
import { MenuItemContainerItem } from "../../entities/menu-item-container-item.entity";

export function menuItemContainerItemToUpdateDto(menuItemContainerItem: MenuItemContainerItem): UpdateMenuItemContainerItemDto {
    return {
        containedMenuItemId: menuItemContainerItem.containedMenuItem.id,
        containedItemSizeId: menuItemContainerItem.containedItemSize.id,
        quantity: menuItemContainerItem.quantity,
    };
}

export function menuItemContainerItemToNestedUpdateDto(menuItemContainerItem: MenuItemContainerItem): NestedUpdateMenuItemContainerItemDto {
    return {
        id: menuItemContainerItem.id,
        containedMenuItemId: menuItemContainerItem.containedMenuItem.id,
        containedItemSizeId: menuItemContainerItem.containedItemSize.id,
        quantity: menuItemContainerItem.quantity,
    };
}