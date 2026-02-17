import { UpdateMenuItemSizeDto } from "../../dto/menu-item-size/update-menu-item-size.dto";
import { MenuItemSize } from "../../entities/menu-item-size.entity";

export function menuItemSizeToUpdateDto(menuItemSize: MenuItemSize): UpdateMenuItemSizeDto {
    return {
        name: menuItemSize.name,
    };
}