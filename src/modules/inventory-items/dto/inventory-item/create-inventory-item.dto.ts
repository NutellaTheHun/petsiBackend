import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { CreateChildInventoryItemSizeDto } from "../inventory-item-size/create-child-inventory-item-size.dto";

export class CreateInventoryItemDto {
    @ApiProperty({ example: 'Evaporated Milk, Sliced Almonds, Large Pie Tins', description: 'Name of Inventory-Item entity.' })
    @IsString()
    @IsNotEmpty()
    readonly itemName: string;

    @ApiProperty({ description: 'Id of Inventory-Item-Category entity.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly inventoryItemCategoryId?: number;

    @ApiProperty({ description: 'Id of Inventory-Item-Vendor entity.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly vendorId?: number;

    @ApiProperty({
        description: 'Array of CreateChildInventoryItemSizeDtos. Child dtos are used when creating/updating an entity through a parent (Inventory-Item).',
        type: [CreateChildInventoryItemSizeDto]
    })
    @IsOptional()
    @IsArray()
    readonly itemSizeDtos?: CreateChildInventoryItemSizeDto[];
}
