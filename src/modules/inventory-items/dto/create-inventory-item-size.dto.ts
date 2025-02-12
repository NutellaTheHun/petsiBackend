import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateInventoryItemSizeDto {
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly unitOfMeasureId: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly inventoryPackageTypeId: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly inventoryItemId: number;
}