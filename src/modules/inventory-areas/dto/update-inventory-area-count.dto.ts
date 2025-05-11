import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { InventoryAreaItemUnionResolver } from "../utils/inventory-area-item-union-resolver";
import { CreateChildInventoryAreaItemDto } from "./create-child-inventory-area-item.dto";
import { UpdateChildInventoryAreaItemDto } from "./update-child-inventory-area-item.dto";

export class UpdateInventoryAreaCountDto {
    @IsNumber()
    @IsOptional()
    readonly inventoryAreaId?: number;
    
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InventoryAreaItemUnionResolver)
    readonly itemCountDtos?: (CreateChildInventoryAreaItemDto | UpdateChildInventoryAreaItemDto)[];
}