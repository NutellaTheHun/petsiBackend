import { IsNumber, IsNotEmpty, IsPositive } from "class-validator";

export class BaseOrderMenuItemDto {
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly orderId: number;

    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly menuItemId: number

    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly quantity: number

    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly menuItemSizeId: number
}