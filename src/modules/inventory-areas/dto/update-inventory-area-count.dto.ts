import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { InventoryAreaItemUnionResolver } from "../utils/inventory-area-item-union-resolver";
import { CreateChildInventoryAreaItemDto } from "./create-child-inventory-area-item.dto";
import { UpdateChildInventoryAreaItemDto } from "./update-child-inventory-area-item.dto";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateInventoryAreaCountDto {
    @ApiProperty({ description: 'Id for Inventory-Area entity.' })
    @IsNumber()
    @IsOptional()
    readonly inventoryAreaId?: number;
    
    @ApiProperty({ description: 'Array with combination of CreateChildInventoryAreaItemDto and UpdateChildInventoryAreaItemDto, child Dtos are only used when updating a parent entity, and creating/updating children through the parent.',
        type: [CreateChildInventoryAreaItemDto]
     })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InventoryAreaItemUnionResolver)
    readonly itemCountDtos?: (CreateChildInventoryAreaItemDto | UpdateChildInventoryAreaItemDto)[];
}