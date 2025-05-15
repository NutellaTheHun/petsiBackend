import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateInventoryItemCategoryDto {
    @ApiProperty({ example: 'Dairy, Dry Goods, Produce', description: 'Name of Inventory-Item-Category entity.' })
    @IsString()
    @IsOptional()
    readonly name?: string;

    @ApiProperty({ description: 'Array of Inventory-Item entity Ids that are in its category.'})
    @IsArray()
    @IsPositive({ each: true})
    @IsNumber({}, { each: true})
    @IsOptional()
    readonly inventoryItemIds?: number[];
}