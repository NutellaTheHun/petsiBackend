import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class CreateMenuItemComponentDto {
    //readonly mode: 'create' = 'create';

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly containerId: number; // menuItem

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly containerSizeId: number; // menuItem

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly menuItemId: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly menuItemSizeId: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly quantity: number;
}