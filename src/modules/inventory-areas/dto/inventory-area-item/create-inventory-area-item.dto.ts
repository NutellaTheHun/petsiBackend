import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateChildInventoryItemSizeDto } from "../../../inventory-items/dto/inventory-item-size/create-child-inventory-item-size.dto";
import { UpdateChildInventoryItemSizeDto } from "../../../inventory-items/dto/inventory-item-size/update-child-inventory-item-size.dto";
import { InventoryAreaCount } from "../../entities/inventory-area-count.entity";

/**
 * Depreciated, only created as a child through {@link InventoryAreaCount}.
 */
export class CreateInventoryAreaItemDto {
    @ApiProperty({ description: 'Id for InventoryAreaCount entity.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly parentInventoryCountId: number;

    @ApiProperty({
        description: 'Id for InventoryItem entity.',
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly countedInventoryItemId: number;

    @ApiProperty({
        example: '6pk(countedAmount) of 28oz(measure amount) can of evaporated milk',
        description: 'The amount of InventoryItem per unit.'
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly countedAmount?: number;

    @ApiProperty({
        description: 'Id for InventoryItemSize entity. If countedItemSizeId is null, countedItemSizeDto must be populated.',
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly countedItemSizeId?: number;

    @ApiProperty({
        description: 'Is optional, if countedItemSizeDto is null, countedItemSizeId must be populated.',
        type: CreateChildInventoryItemSizeDto
    })
    @IsOptional()
    readonly countedItemSizeDto?: (CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto);
}