import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from "class-validator";
import { InventoryItemSizeUnionResolver } from "../utils/inventory-item-size-union-resolver";
import { CreateChildInventoryItemSizeDto } from "./create-child-inventory-item-size.dto";
import { UpdateChildInventoryItemSizeDto } from "./update-child-inventory-item-size.dto";

export class UpdateInventoryItemDto {
    @IsString()
    @IsOptional()
    readonly name?: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly inventoryItemCategoryId?: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly vendorId?: number;
    
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InventoryItemSizeUnionResolver)
    readonly sizeDtos?: (CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto)[];
}