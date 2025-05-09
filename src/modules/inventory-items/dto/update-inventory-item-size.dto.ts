import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateInventoryItemSizeDto{
    readonly mode: 'update' = 'update';

    @IsNumber()
    @IsPositive()
    readonly id: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly unitOfMeasureId?: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly inventoryPackageTypeId?: number;
}