import { IsNumber, IsPositive, Validate } from "class-validator";
import { BaseMenuItemComponentDto } from "./base-menu-item-component.dto";
import { MenuItemUpdateItemSizeCheck } from "./validators/menu-item-update-item-size-check.validator";

export class UpdateMenuItemComponentDto extends BaseMenuItemComponentDto {
    readonly mode: 'update' = 'update';

    @IsNumber()
    @IsPositive()
    readonly id: number;

    @Validate(MenuItemUpdateItemSizeCheck)
    private readonly _menuItemSizeValidator = true;
}