import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { BaseInventoryItemSizeDto } from "./base-inventory-item-size.dto";

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