import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsPositive, IsString, Min, ValidateNested } from "class-validator";
import { InventoryItemSizeUnionResolver } from "../../utils/inventory-item-size-union-resolver";
import { CreateChildInventoryItemSizeDto } from "../inventory-item-size/create-child-inventory-item-size.dto";
import { UpdateChildInventoryItemSizeDto } from "../inventory-item-size/update-child-inventory-item-size.dto";

export class UpdateInventoryItemDto {
    @ApiProperty({ example: 'Evaporated Milk, Sliced Almonds, Large Pie Tins', description: 'Name of InventoryItem entity.' })
    @IsString()
    @IsOptional()
    readonly itemName?: string;

    @ApiProperty({
        description: 'Id of InventoryItemCategory entity.',
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly inventoryItemCategoryId?: number | null;

    @ApiProperty({
        description: 'Id of InventoryItemVendor entity.',
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly vendorId?: number | null;

    @ApiProperty({
        description: 'Mixed array of CreateChildInventoryItemSizeDtos and UpdateChildInventoryItemSizeDtos. Child dtos are used when creating/updating an entity through a parent (InventoryItem).',
        type: [UpdateChildInventoryItemSizeDto]
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InventoryItemSizeUnionResolver)
    readonly itemSizeDtos?: (CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto)[];

    @ApiProperty({ description: 'Price paid for the InventoryItem entity.' })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Min(0)
    cost?: number;
}