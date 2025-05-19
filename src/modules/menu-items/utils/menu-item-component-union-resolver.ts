import { CreateChildMenuItemContainerItemDto } from "../dto/menu-item-container-item/create-child-menu-item-container-item.dto";
import { UpdateChildMenuItemContainerItemDto } from "../dto/menu-item-container-item/update-child-menu-item-container-item.dto";

export function MenuItemComponentUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateChildMenuItemContainerItemDto;
    return CreateChildMenuItemContainerItemDto;
}