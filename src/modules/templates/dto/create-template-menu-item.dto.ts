import { BaseTemplateMenuItemDto } from "./base-template-menu-item.dto";

export class CreateTemplateMenuItemDto extends BaseTemplateMenuItemDto {
        readonly mode: 'create' = 'create';
}
