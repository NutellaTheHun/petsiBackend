import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateInventoryItemSizeDto{
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly unitOfMeasureId?: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly inventoryPackageTypeId?: number;
}