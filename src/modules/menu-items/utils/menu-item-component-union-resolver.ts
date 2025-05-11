import { CreateChildMenuItemComponentDto } from "../dto/create-child-menu-item-component.dto";
import { UpdateChildMenuItemComponentDto } from "../dto/update-child-menu-item-component.dto";

export function MenuItemComponentUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateChildMenuItemComponentDto;
    return CreateChildMenuItemComponentDto;
}