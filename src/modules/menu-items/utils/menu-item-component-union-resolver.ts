import { CreateMenuItemComponentDto } from "../dto/create-menu-item-component.dto";
import { UpdateMenuItemComponentDto } from "../dto/update-menu-item-component.dto";

export function MenuItemComponentUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateMenuItemComponentDto;
    return CreateMenuItemComponentDto;
}