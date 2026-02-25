import { plainToInstance } from "class-transformer";
import { UpdateTemplateDto } from "../../dto/template/update-template.dto";
import { Template } from "../../entities/template.entity";
import { templateMenuItemToNestedUpdateDto } from "./template-menu-item.dto.transformer";

export function templateToUpdateDto(template: Template, merge: Partial<UpdateTemplateDto> = {}): UpdateTemplateDto {
    const existingTemplateMenuItems = template.templateMenuItems.map(templateMenuItem => templateMenuItemToNestedUpdateDto(templateMenuItem)) ?? [];
    const mergedTemplateMenuItems = merge.templateMenuItems ? [...existingTemplateMenuItems, ...merge.templateMenuItems] : existingTemplateMenuItems;

    return plainToInstance(UpdateTemplateDto, {
        name: template.name,
        ...merge,
        templateMenuItems: mergedTemplateMenuItems,
    });
}