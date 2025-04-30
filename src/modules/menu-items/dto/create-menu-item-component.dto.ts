import { BaseMenuItemComponentDto } from "./base-menu-item-component.dto";

export class CreateMenuItemComponentDto extends BaseMenuItemComponentDto {
    readonly mode: 'create' = 'create';
}