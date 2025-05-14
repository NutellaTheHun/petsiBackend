import { CreateChildTemplateMenuItemDto } from "../dto/create-child-template-menu-item.dto";
import { UpdateChildTemplateMenuItemDto } from "../dto/update-child-template-menu-item.dto";

export function TemplateMenuItemUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateChildTemplateMenuItemDto;
    return CreateChildTemplateMenuItemDto;
}