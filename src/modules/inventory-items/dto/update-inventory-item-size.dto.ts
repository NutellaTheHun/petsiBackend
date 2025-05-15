import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive } from "class-validator";

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
}