import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateChildInventoryItemSizeDto } from "../../../inventory-items/dto/inventory-item-size/create-child-inventory-item-size.dto";
import { UpdateChildInventoryItemSizeDto } from "../../../inventory-items/dto/inventory-item-size/update-child-inventory-item-size.dto";

export class UpdateInventoryAreaItemDto {
    @ApiProperty({ description: 'Id for Inventory-Area-Count entity.' })
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
    @ApiProperty({ description: 'Id for Inventory-Item-Size entity. Is optional, if itemSizeId is populated, itemSizeDto must be null/undefined.' })
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
    @ApiProperty({ description: 'Creational or update Dto for Inventory-Item-Size. Is optional, if itemSizeDto is populated, itemSizeId must be null/undefined.',
        type: [CreateChildInventoryItemSizeDto]
     })
    @IsOptional()
    readonly itemSizeDto?: (CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto);
}