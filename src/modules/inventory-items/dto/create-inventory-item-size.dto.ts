import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";
import { BaseInventoryItemSizeDto } from "./base-inventory-item-size.dto";

export class CreateInventoryItemSizeDto {
    readonly mode: 'create' = 'create';

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly inventoryItemId: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly unitOfMeasureId: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly inventoryPackageTypeId: number;
}