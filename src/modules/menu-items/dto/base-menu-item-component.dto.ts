import { IsNumber, IsPositive } from "class-validator";

export class BaseMenuItemComponentDto { 
    @IsNumber()
    @IsPositive()
    readonly containerId: number; // menuItem

    @IsNumber()
    @IsPositive()
    readonly containerSizeId: number; // menuItem

    @IsNumber()
    @IsPositive()
    readonly menuItemId: number;

    @IsNumber()
    @IsPositive()
    readonly menuItemSizeId: number;

    @IsNumber()
    @IsPositive()
    readonly quantity: number;
}