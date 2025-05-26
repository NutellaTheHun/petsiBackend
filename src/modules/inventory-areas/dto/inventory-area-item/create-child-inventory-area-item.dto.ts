import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateChildInventoryItemSizeDto } from "../../../inventory-items/dto/inventory-item-size/create-child-inventory-item-size.dto";

/**
 * This DTO is used when creating an inventory-area-item through the update of an inventory area count.
 * - Compared to the base createDto, the child version:
 * - Includes the mode of "create/update",
 * - Excludes the areaCount id field, as in this context the area-count isn't in the db yet so no id.
 */
export class CreateChildInventoryAreaItemDto {
    @ApiProperty({ description: 'A requirement of all child dtos. Relevant when creating/updating an InventoryAreaCount entity.' })
    @IsNotEmpty()
    readonly mode: 'create' = 'create';

    @ApiProperty({
        description: 'Id for InventoryItem entity.',
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly countedInventoryItemId: number;

    @ApiProperty({ example: '6pk(unit amount) of 28oz(measure amount) can of evaporated milk', description: 'The amount of InventoryItem per unit.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly countedAmount?: number;

    @ApiProperty({
        description: 'Is optional, if itemSizeId is null, itemSizeDto must be populated.',
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly countedItemSizeId?: number;

    @ApiProperty({
        description: 'Is optional, if itemSizeDto is null, itemSizeId must be populated.',
        type: CreateChildInventoryItemSizeDto,
    })
    @IsOptional()
    readonly countedItemSizeDto?: CreateChildInventoryItemSizeDto;
}