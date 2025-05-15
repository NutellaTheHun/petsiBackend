import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateChildInventoryItemSizeDto{
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating an Inventory-Item entity.' })
    @IsNotEmpty()
    readonly mode: 'update' = 'update';

    /**
     * Used when updating and inventory item, and through this object is updating an item-size
     */
    @ApiProperty({ description: 'Id of Inventory-Item-Size entity to be updated.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

    @ApiProperty({ description: 'Id of Unit-of-Measure entity.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly unitOfMeasureId?: number;

    @ApiProperty({ description: 'Id of Inventory-Item-Package entity.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly inventoryPackageTypeId?: number;
}