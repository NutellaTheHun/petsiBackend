import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, Min } from "class-validator";

export class UpdateChildInventoryItemSizeDto{
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating an Inventory-Item entity.' })
    @IsNotEmpty()
    readonly mode: 'update' = 'update';

    @ApiProperty({ description: 'Id of Inventory-Item-Size entity to be updated.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

    @ApiProperty({ description: 'Id of Unit-of-Measure entity.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly measureUnitId?: number;

    @ApiProperty({ example: '10(measure amount) lb of flower', description: 'the unit quantity of the Unit-of-Measure entity.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly measureAmount?: number;

    @ApiProperty({ description: 'Id of Inventory-Item-Package entity.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly inventoryPackageId?: number;

    @ApiProperty({ description: 'Price paid for the Inventory-Item entity.'})
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Min(0)
    cost?: number;
}