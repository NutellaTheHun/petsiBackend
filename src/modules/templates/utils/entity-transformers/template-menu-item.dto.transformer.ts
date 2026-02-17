import { NestedUpdateTemplateMenuItemDto } from "../../dto/template-menu-item/nested-update-template-menu-item.dto";
import { UpdateTemplateMenuItemDto } from "../../dto/template-menu-item/update-template-menu-item.dto";
import { TemplateMenuItem } from "../../entities/template-menu-item.entity";

export function templateMenuItemToUpdateDto(templateMenuItem: TemplateMenuItem): UpdateTemplateMenuItemDto {
    return {
        displayName: templateMenuItem.displayName,
        menuItemId: templateMenuItem.menuItem.id,
        tablePosIndex: templateMenuItem.tablePosIndex,
    };
}

export function templateMenuItemToNestedUpdateDto(templateMenuItem: TemplateMenuItem): NestedUpdateTemplateMenuItemDto {
    return {
        id: templateMenuItem.id,
        displayName: templateMenuItem.displayName,
        menuItemId: templateMenuItem.menuItem.id,
        tablePosIndex: templateMenuItem.tablePosIndex,
    };
}