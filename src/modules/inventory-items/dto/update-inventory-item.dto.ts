import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsPositive, IsString, Min, ValidateNested } from "class-validator";
import { InventoryItemSizeUnionResolver } from "../utils/inventory-item-size-union-resolver";
import { CreateChildInventoryItemSizeDto } from "./create-child-inventory-item-size.dto";
import { UpdateChildInventoryItemSizeDto } from "./update-child-inventory-item-size.dto";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateInventoryItemDto {
    @ApiProperty({ example: 'Evaporated Milk, Sliced Almonds, Large Pie Tins', description: 'Name of Inventory-Item entity.' })
    @IsString()
    @IsOptional()
    readonly name?: string;

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
    
    @ApiProperty({ description: 'Mixed array of CreateChildInventoryItemSizeDtos and UpdateChildInventoryItemSizeDtos. Child dtos are used when creating/updating an entity through a parent (Inventory-Item).',
        type: [UpdateChildInventoryItemSizeDto]
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InventoryItemSizeUnionResolver)
    readonly sizeDtos?: (CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto)[];

    @ApiProperty({ description: 'Price paid for the Inventory-Item entity.'})
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Min(0)
    cost?: number;
}