import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive, Min } from "class-validator";

export class UpdateInventoryItemSizeDto {
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

    @ApiProperty({ description: 'Prsice paid for the Inventory-Item entity.' })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Min(0)
    cost?: number;
}