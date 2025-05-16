import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, Min } from "class-validator";

export class UpdateInventoryItemSizeDto{
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

    @ApiProperty({ description: 'Price paid for the Inventory-Item entity.'})
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Min(0)
    cost?: number;

    @ApiProperty({ example: '10(measure amount) lb of flower', description: 'the unit quantity of the Unit-of-Measure entity.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly measureAmount?: number;
}