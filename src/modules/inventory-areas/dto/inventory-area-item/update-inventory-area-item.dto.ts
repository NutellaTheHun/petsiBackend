import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateChildInventoryItemSizeDto } from "../../../inventory-items/dto/inventory-item-size/create-child-inventory-item-size.dto";
import { UpdateChildInventoryItemSizeDto } from "../../../inventory-items/dto/inventory-item-size/update-child-inventory-item-size.dto";
import { InventoryItem } from "../../../inventory-items/entities/inventory-item.entity";

export class UpdateInventoryAreaItemDto {
    @ApiProperty({
        description: 'Id for InventoryItem entity.',
        type: InventoryItem
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly countedInventoryItemId?: number;

    @ApiProperty({
        example: '6pk(countedAmount) of 28oz(measure amount) can of evaporated milk',
        description: 'The amount of InventoryItem per unit.'
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly countedAmount?: number;

    @ApiProperty({
        description: 'Id for InventoryItemSize entity. If countedItemSizeId is populated, countedItemSizeDto must be null/undefined.',
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly countedItemSizeId?: number;

    @ApiProperty({
        description: 'If countedItemSizeDto is populated, countedItemSizeId must be null/undefined.',
        type: UpdateChildInventoryItemSizeDto
    })
    @IsOptional()
    readonly countedItemSizeDto?: (CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto);
}