import { IsArray, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { CreateInventoryAreaItemDto } from "./create-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "./update-inventory-area-item-count.dto";
import { Type } from "class-transformer";
import { InventoryAreaItemUnionResolver } from "../utils/inventory-area-item-union-resolver";

export class UpdateInventoryAreaCountDto {
    @IsNumber()
    @IsOptional()
    readonly inventoryAreaId: number;
    
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InventoryAreaItemUnionResolver)
    readonly itemCountDtos: (CreateInventoryAreaItemDto | UpdateInventoryAreaItemDto)[];
}