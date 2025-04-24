import { CreateTemplateMenuItemDto } from "../dto/create-template-menu-item.dto";
import { UpdateTemplateMenuItemDto } from "../dto/update-template-menu-item.dto";

export function TemplateMenuItemUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateTemplateMenuItemDto;
    return CreateTemplateMenuItemDto;
}