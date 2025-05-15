import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateInventoryItemSizeDto } from "../../inventory-items/dto/create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../../inventory-items/dto/update-inventory-item-size.dto";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateChildInventoryAreaItemDto {
    @ApiProperty({ description: 'Declare whether creating or updating a child entity. Relevant when creating/updating an Inventory-Area-Count entity.' })
    @IsNotEmpty()
    readonly mode: 'update' = 'update';

    /**
     * Is used only when the area-item is being updated through an update of an inventory-area-count
     */
    @ApiProperty({ description: 'Id of the Inventory-Area-Item to update.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

    @ApiProperty({ description: 'Id of the Area-Count parent entity.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly areaCountId?: number;

    @ApiProperty({ description: 'Id for Inventory-Item entity.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly inventoryItemId?: number;

    @ApiProperty({ example: '6pk(unit amount) of 28oz(measure amount) can of evaporated milk', description: 'The amount of Inventory-Item per unit.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly unitAmount?: number;

    @ApiProperty({ example: '10(measure amount) lb of flower', description: 'the quantity of the Inventory-Item with the Item-Size.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly measureAmount?: number;

    /**
     * -When creating a countedItem (during an inventory count), 
     * an item could assign a pre-existing InventoryItemSize or create a new one.
     * - If the itemSize exists, the DTO that the controller recieves with have a populated itemSizeId property, and an empty itemSizeCreateDto
     * - If the itemSize is new, the DTO that the controller recieves will have a populated itemSizeCreateDto, and no itemSizeId propery. 
     *   At the controller level, the itemSize will be created, and its ID will be passed along with the original DTO to the service.  
     */
    @ApiProperty({ description: 'Id for Inventory-Item-Size entity. Is optional, if itemSizeId is null, itemSizeDto must be populated.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly itemSizeId?: number;

    /**
     * -When creating a countedItem (during an inventory count), 
     * an item could assign a pre-existing InventoryItemSize or create a new one.
     * - If the itemSize exists, the DTO that the controller recieves with have a populated itemSizeId property, and an empty itemSizeCreateDto
     * - If the itemSize is new, the DTO that the controller recieves will have a populated itemSizeCreateDto, and no itemSizeId propery. 
     *   At the controller level, the itemSize will be created, and its ID will be passed along with the original DTO to the service.  
     */
    @ApiProperty({ description: 'Creational or update Dto for Inventory-Item-Size. Is optional, if itemSizeDto is null, itemSizeId must be populated.',
        type: [UpdateInventoryItemSizeDto]
     })
    @IsOptional()
    readonly itemSizeDto?: (CreateInventoryItemSizeDto | UpdateInventoryItemSizeDto);
}