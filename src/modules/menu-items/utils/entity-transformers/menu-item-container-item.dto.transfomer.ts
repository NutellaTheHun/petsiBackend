import { plainToInstance } from "class-transformer";
import { NestedUpdateMenuItemContainerItemDto } from "../../dto/menu-item-container-item/nested-update-menu-item-container-item.dto";
import { UpdateMenuItemContainerItemDto } from "../../dto/menu-item-container-item/update-menu-item-container-item.dto";
import { MenuItemContainerItem } from "../../entities/menu-item-container-item.entity";

export function menuItemContainerItemToUpdateDto(menuItemContainerItem: MenuItemContainerItem, merge: Partial<UpdateMenuItemContainerItemDto> = {}): UpdateMenuItemContainerItemDto {
    return plainToInstance(UpdateMenuItemContainerItemDto, {
        containedMenuItemId: menuItemContainerItem.containedMenuItem.id,
        containedItemSizeId: menuItemContainerItem.containedItemSize.id,
        quantity: menuItemContainerItem.quantity,
        ...merge,
    });
}

export function menuItemContainerItemToNestedUpdateDto(menuItemContainerItem: MenuItemContainerItem, merge: Partial<NestedUpdateMenuItemContainerItemDto> = {}): NestedUpdateMenuItemContainerItemDto {
    return plainToInstance(NestedUpdateMenuItemContainerItemDto, {
        id: menuItemContainerItem.id,
        containedMenuItemId: menuItemContainerItem.containedMenuItem.id,
        containedItemSizeId: menuItemContainerItem.containedItemSize.id,
        quantity: menuItemContainerItem.quantity,
        ...merge,
    });
}