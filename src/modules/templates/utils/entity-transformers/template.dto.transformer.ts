import { UpdateTemplateDto } from "../../dto/template/update-template.dto";
import { Template } from "../../entities/template.entity";
import { templateMenuItemToNestedUpdateDto } from "./template-menu-item.dto.transformer";

export function templateToUpdateDto(template: Template): UpdateTemplateDto {
    return {
        name: template.name,
        templateMenuItems: template.templateMenuItems.map(templateMenuItem => templateMenuItemToNestedUpdateDto(templateMenuItem)),
    };
}