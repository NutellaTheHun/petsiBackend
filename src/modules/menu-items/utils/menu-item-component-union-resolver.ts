import { CreateChildMenuItemComponentDto } from "../dto/menu-item-component/create-child-menu-item-component.dto";
import { UpdateChildMenuItemComponentDto } from "../dto/menu-item-component/update-child-menu-item-component.dto";

export function MenuItemComponentUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateChildMenuItemComponentDto;
    return CreateChildMenuItemComponentDto;
}