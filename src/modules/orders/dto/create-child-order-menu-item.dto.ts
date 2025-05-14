import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class CreateChildOrderMenuItemDto {
    readonly mode: 'create' = 'create';

    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly menuItemId: number

    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly menuItemSizeId: number

    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly quantity: number
}