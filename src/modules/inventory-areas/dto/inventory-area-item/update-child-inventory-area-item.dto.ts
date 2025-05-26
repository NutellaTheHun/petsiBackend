import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateChildInventoryItemSizeDto } from "../../../inventory-items/dto/inventory-item-size/create-child-inventory-item-size.dto";
import { UpdateChildInventoryItemSizeDto } from "../../../inventory-items/dto/inventory-item-size/update-child-inventory-item-size.dto";

export class UpdateChildInventoryAreaItemDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating an Inventory-Area-Count entity.' })
    @IsNotEmpty()
    readonly mode: 'update' = 'update';

    @ApiProperty({ description: 'Id of the InventoryAreaItem to update.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

    @ApiProperty({
        description: 'Id for InventoryItem entity.',

    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly countedInventoryItemId?: number;

    @ApiProperty({ example: '6pk(unit amount) of 28oz(measure amount) can of evaporated milk', description: 'The amount of InventoryItem per unit.' })
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
        description: 'Creational or update Dto for InventoryItemSize. If countedItemSizeDto is null, countedItemSizeId must be populated.',
        type: UpdateChildInventoryItemSizeDto
    })
    @IsOptional()
    readonly countedItemSizeDto?: (CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto);
}