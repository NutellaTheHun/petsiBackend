import { IsNumber, IsPositive } from "class-validator";
import { BaseMenuItemComponentDto } from "./base-menu-item-component.dto";

export class UpdateMenuItemComponentDto extends BaseMenuItemComponentDto {
    readonly mode: 'update' = 'update';

    @IsNumber()
    @IsPositive()
    readonly id: number;
}