import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateInventoryItemCategoryDto {
    @ApiProperty({ example: 'Dairy, Dry Goods, Produce', description: 'Name of InventoryItemCategory entity.' })
    @IsString()
    @IsNotEmpty()
    readonly itemCategoryName: string;
}