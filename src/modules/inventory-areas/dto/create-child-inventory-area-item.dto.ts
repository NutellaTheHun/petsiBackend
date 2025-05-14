import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateInventoryItemSizeDto } from "../../inventory-items/dto/create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../../inventory-items/dto/update-inventory-item-size.dto";

/**
 * This DTO is used when creating an inventory-area-item through the update of an inventory area count.
 * - Compared to the base createDto, the child version:
 * - Includes the mode of "create/update",
 * - Excludes the areaCount id field, as in this context the area-count isn't in the db yet so no id.
 */
export class CreateChildInventoryAreaItemDto {
    readonly mode: 'create' = 'create';

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly inventoryItemId: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly unitAmount?: number;

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly measureAmount: number;

    /**
     * -When creating a countedItem (during an inventory count), 
     * an item could assign a pre-existing InventoryItemSize or create a new one.
     * - If the itemSize exists, the DTO that the controller recieves with have a populated itemSizeId property, and an empty itemSizeCreateDto
     * - If the itemSize is new, the DTO that the controller recieves will have a populated itemSizeCreateDto, and no itemSizeId propery. 
     *   At the controller level, the itemSize will be created, and its ID will be passed along with the original DTO to the service.  
     */
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
    @IsOptional()
    readonly itemSizeDto?: (CreateInventoryItemSizeDto | UpdateInventoryItemSizeDto);
}