import { plainToInstance } from "class-transformer";
import { UpdateMenuItemCategoryDto } from "../../dto/menu-item-category/update-menu-item-category.dto";
import { MenuItemCategory } from "../../entities/menu-item-category.entity";

export function menuItemCategoryToUpdateDto(menuItemCategory: MenuItemCategory): UpdateMenuItemCategoryDto {
    return plainToInstance(UpdateMenuItemCategoryDto, {
        name: menuItemCategory.name,
    });
}