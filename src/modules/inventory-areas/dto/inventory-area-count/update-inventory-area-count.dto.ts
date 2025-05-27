import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { InventoryAreaItemUnionResolver } from "../../utils/inventory-area-item-union-resolver";
import { CreateChildInventoryAreaItemDto } from "../inventory-area-item/create-child-inventory-area-item.dto";
import { UpdateChildInventoryAreaItemDto } from "../inventory-area-item/update-child-inventory-area-item.dto";

export class UpdateInventoryAreaCountDto {
    @ApiProperty({
        description: 'Id for Inventory-Area entity.',
    })
    @IsNumber()
    @IsOptional()
    readonly inventoryAreaId?: number;

    @ApiProperty({
        description: 'Child Dtos are used when the the child entity is being created/updated through the parent, in this case, the InventoryAreaItem is being created or updated during the update request of the InventoryAreaCount (throught the InventoryAreaCount endpoint).',
        type: [UpdateChildInventoryAreaItemDto]
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InventoryAreaItemUnionResolver)
    readonly itemCountDtos?: (CreateChildInventoryAreaItemDto | UpdateChildInventoryAreaItemDto)[];
}