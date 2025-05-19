import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateInventoryItemCategoryDto {
    @ApiProperty({ example: 'Dairy, Dry Goods, Produce', description: 'Name of Inventory-Item-Category entity.' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}