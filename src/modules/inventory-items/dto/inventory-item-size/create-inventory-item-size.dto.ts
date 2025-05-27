import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive, Min } from "class-validator";
import { InventoryItem } from "../../entities/inventory-item.entity";

/**
 * Depreciated, only created as a child through {@link InventoryItem}.
 */
export class CreateInventoryItemSizeDto {
    @ApiProperty({
        description: 'Id of InventoryItem entity.',
        type: [InventoryItem]
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly inventoryItemId: number;

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
    @IsNotEmpty()
    @Min(0)
    cost: number;
}