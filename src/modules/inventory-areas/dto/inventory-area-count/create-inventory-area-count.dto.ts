import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { CreateChildInventoryAreaItemDto } from "../inventory-area-item/create-child-inventory-area-item.dto";

export class CreateInventoryAreaCountDto{
    @ApiProperty({ description: 'Id for Inventory-Area entity.' })
    @IsNumber()
    @IsNotEmpty()
    readonly inventoryAreaId: number;

    @ApiProperty({ description: 'Array with combination of CreateChildInventoryAreaItemDto and UpdateChildInventoryAreaItemDto, child Dtos are only used when updating a parent entity, and creating/updating children through the parent.',
        type: [CreateChildInventoryAreaItemDto]
        })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    readonly itemCountDtos?: CreateChildInventoryAreaItemDto[];
}