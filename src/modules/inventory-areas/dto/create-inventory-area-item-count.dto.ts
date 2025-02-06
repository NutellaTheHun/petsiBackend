import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class CreateInventoryAreaItemCountDto {
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly areaCountId: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly inventoryItemId: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly itemQuantity: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly itemSizeId: number;
}