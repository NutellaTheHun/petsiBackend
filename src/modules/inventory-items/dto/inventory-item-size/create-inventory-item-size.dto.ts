import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive, Min } from "class-validator";
import { InventoryItem } from "../../entities/inventory-item.entity";

/**
 * Depreciated, only created as a child through {@link InventoryItem}.
 */
export class CreateInventoryItemSizeDto {
    @ApiProperty({ description: 'Id of Inventory-Item entity.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly inventoryItemId: number;

    @ApiProperty({ description: 'Id of Unit-of-Measure entity.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly measureUnitId: number;

    @ApiProperty({ example: '10(measure amount) lb of flower', description: 'the unit quantity of the Unit-of-Measure entity.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly measureAmount: number;

    @ApiProperty({ description: 'Id of Inventory-Item-Package entity.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly inventoryPackageId: number;

    @ApiProperty({ description: 'Price paid for the Inventory-Item entity.'})
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsNotEmpty()
    @Min(0)
    cost: number;
}