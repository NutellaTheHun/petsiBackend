import { IsNumber, IsPositive, IsNotEmpty, IsOptional } from "class-validator";

export class BaseInventoryItemSizeDto {
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
    @IsOptional()
    readonly inventoryItemId?: number;
}