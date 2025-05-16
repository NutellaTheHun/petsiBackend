import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateChildInventoryItemSizeDto } from "../../inventory-items/dto/create-child-inventory-item-size.dto";
import { UpdateChildInventoryItemSizeDto } from "../../inventory-items/dto/update-child-inventory-item-size.dto";

export class CreateInventoryAreaItemDto {
    @ApiProperty({ description: 'Id for Inventory-Area-Count entity.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly areaCountId: number;

    @ApiProperty({ description: 'Id for Inventory-Item entity.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly inventoryItemId: number;

    @ApiProperty({ example: '6pk(unit amount) of 28oz(measure amount) can of evaporated milk', description: 'The amount of Inventory-Item per unit.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly unitAmount?: number;

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
        type: [CreateChildInventoryItemSizeDto]
     })
    @IsOptional()
    readonly itemSizeDto?: (CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto);
}