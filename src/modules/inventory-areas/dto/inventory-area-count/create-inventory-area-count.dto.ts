import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { CreateChildInventoryAreaItemDto } from "../inventory-area-item/create-child-inventory-area-item.dto";

export class CreateInventoryAreaCountDto {
    @ApiProperty({
        description: 'Id for InventoryArea entity.',
    })
    @IsNumber()
    @IsNotEmpty()
    readonly inventoryAreaId: number;

    @ApiProperty({
        description: 'Child Dtos are used when the the child entity is being created/updated through the parent, in this case, the InventoryAreaItem is being created during the created of the InventoryAreaCount (throught the InventoryAreaCount endpoint).',
        type: [CreateChildInventoryAreaItemDto]
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    readonly itemCountDtos?: CreateChildInventoryAreaItemDto[];
}