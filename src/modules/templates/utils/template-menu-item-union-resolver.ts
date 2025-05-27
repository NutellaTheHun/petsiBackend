import { CreateChildTemplateMenuItemDto } from "../dto/template-menu-item/create-child-template-menu-item.dto";
import { UpdateChildTemplateMenuItemDto } from "../dto/template-menu-item/update-child-template-menu-item.dto";

export function TemplateMenuItemUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateChildTemplateMenuItemDto;
    return CreateChildTemplateMenuItemDto;
}