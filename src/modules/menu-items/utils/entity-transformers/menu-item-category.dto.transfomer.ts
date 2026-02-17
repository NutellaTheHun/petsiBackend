import { UpdateMenuItemCategoryDto } from "../../dto/menu-item-category/update-menu-item-category.dto";
import { MenuItemCategory } from "../../entities/menu-item-category.entity";

export function menuItemCategoryToUpdateDto(menuItemCategory: MenuItemCategory): UpdateMenuItemCategoryDto {
    return {
        name: menuItemCategory.name,
    };
}