import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { CreateInventoryItemSizeDto } from "../../inventory-items/dto/create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../../inventory-items/dto/update-inventory-item-size.dto";

export class UpdateInventoryAreaItemDto {
    readonly mode: 'update' = 'update';

    @IsNumber()
    @IsPositive()
    readonly id: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly areaCountId?: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly inventoryItemId: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly unitAmount: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
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
    readonly itemSizeId: number;

    /**
     * -When creating a countedItem (during an inventory count), 
     * an item could assign a pre-existing InventoryItemSize or create a new one.
     * - If the itemSize exists, the DTO that the controller recieves with have a populated itemSizeId property, and an empty itemSizeCreateDto
     * - If the itemSize is new, the DTO that the controller recieves will have a populated itemSizeCreateDto, and no itemSizeId propery. 
     *   At the controller level, the itemSize will be created, and its ID will be passed along with the original DTO to the service.  
     */
    @IsOptional()
    readonly itemSizeDto: (CreateInventoryItemSizeDto | UpdateInventoryItemSizeDto);
}