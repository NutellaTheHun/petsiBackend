import { plainToInstance } from "class-transformer";
import { UpdateMenuItemSizeDto } from "../../dto/menu-item-size/update-menu-item-size.dto";
import { MenuItemSize } from "../../entities/menu-item-size.entity";

export function menuItemSizeToUpdateDto(menuItemSize: MenuItemSize, merge: Partial<UpdateMenuItemSizeDto> = {}): UpdateMenuItemSizeDto {
    return plainToInstance(UpdateMenuItemSizeDto, {
        name: menuItemSize.name,
        ...merge,
    });
}