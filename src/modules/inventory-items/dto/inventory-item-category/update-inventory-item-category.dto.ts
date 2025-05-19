import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateInventoryItemCategoryDto {
    @ApiProperty({ example: 'Dairy, Dry Goods, Produce', description: 'Name of Inventory-Item-Category entity.' })
    @IsString()
    @IsOptional()
    readonly itemCategoryName?: string;
}