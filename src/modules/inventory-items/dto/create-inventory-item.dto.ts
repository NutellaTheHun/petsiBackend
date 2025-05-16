import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from "class-validator";
import { CreateChildInventoryItemSizeDto } from "./create-child-inventory-item-size.dto";
import { ApiProperty } from "@nestjs/swagger";

export class CreateInventoryItemDto {
    @ApiProperty({ example: 'Evaporated Milk, Sliced Almonds, Large Pie Tins', description: 'Name of Inventory-Item entity.' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

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

    @ApiProperty({ description: 'Array of CreateChildInventoryItemSizeDtos. Child dtos are used when creating/updating an entity through a parent (Inventory-Item).',
        type: [CreateChildInventoryItemSizeDto]
     })
    @IsOptional()
    @IsArray()
    readonly itemSizeDtos?: CreateChildInventoryItemSizeDto[];
}
