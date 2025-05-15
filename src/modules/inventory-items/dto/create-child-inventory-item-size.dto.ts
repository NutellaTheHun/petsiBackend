import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class CreateChildInventoryItemSizeDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating an Inventory-Item entity.' })
    @IsNotEmpty()
    readonly mode: 'create' = 'create';

    @ApiProperty({ description: 'Id of Unit-of-Measure entity.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly unitOfMeasureId: number;

    @ApiProperty({ description: 'Id of Inventory-Item-Package entity.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly inventoryPackageTypeId: number;
}