import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { CreateChildInventoryItemSizeDto } from "../inventory-item-size/create-child-inventory-item-size.dto";

export class CreateInventoryItemDto {
    @ApiProperty({ example: 'Evaporated Milk, Sliced Almonds, Large Pie Tins', description: 'Name of InventoryItem entity.' })
    @IsString()
    @IsNotEmpty()
    readonly itemName: string;

    @ApiProperty({
        description: 'Id of InventoryItemCategory entity.',
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly inventoryItemCategoryId?: number;

    @ApiProperty({
        description: 'Id of InventoryItemVendor entity.',
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly vendorId?: number;

    @ApiProperty({
        description: 'Child dtos are used when creating/updating an entity through a parent (InventoryItem).',
        type: [CreateChildInventoryItemSizeDto]
    })
    @IsOptional()
    @IsArray()
    readonly itemSizeDtos?: CreateChildInventoryItemSizeDto[];
}
