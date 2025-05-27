import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, Min } from "class-validator";

export class CreateChildInventoryItemSizeDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating an InventoryItem entity.' })
    @IsNotEmpty()
    readonly mode: 'create' = 'create';

    @ApiProperty({
        description: 'Id of UnitofMeasure entity.',
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly measureUnitId: number;

    @ApiProperty({ example: '10(measure amount) lb of flower', description: 'the unit quantity of the UnitofMeasure entity.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly measureAmount: number;

    @ApiProperty({
        description: 'Id of InventoryItemPackage entity.',
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly inventoryPackageId: number;

    @ApiProperty({ description: 'Price paid for the InventoryItem entity.' })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Min(0)
    cost?: number;
}