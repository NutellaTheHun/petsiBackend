import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateChildInventoryItemSizeDto{
    readonly mode: 'update' = 'update';

    /**
     * Used when updating and inventory item, and through this object is updating an item-size
     */
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