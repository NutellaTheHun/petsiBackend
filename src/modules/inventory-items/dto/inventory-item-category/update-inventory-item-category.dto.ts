import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateInventoryItemCategoryDto {
    @ApiProperty({ example: 'Dairy, Dry Goods, Produce', description: 'Name of InventoryItemCategory entity.' })
    @IsString()
    @IsOptional()
    readonly itemCategoryName?: string;
}