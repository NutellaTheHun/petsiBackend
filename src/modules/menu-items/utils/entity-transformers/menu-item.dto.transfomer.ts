import { UpdateMenuItemDto } from "../../dto/menu-item/update-menu-item.dto";
import { MenuItem } from "../../entities/menu-item.entity";
import { menuItemContainerItemToNestedUpdateDto } from "./menu-item-container-item.dto.transfomer";

export function menuItemToUpdateDto(menuItem: MenuItem): UpdateMenuItemDto {
    return {
        name: menuItem.name,
        type: menuItem.type,
        categoryId: menuItem.category?.id ?? null,
        sizeIds: menuItem.sizes.map(size => size.id),
        containerMenuItems: menuItem.containerMenuItems?.map(containerItem => menuItemContainerItemToNestedUpdateDto(containerItem)) ?? [],
        variableMaxAmount: menuItem.variableMaxAmount ?? null,
    };
}