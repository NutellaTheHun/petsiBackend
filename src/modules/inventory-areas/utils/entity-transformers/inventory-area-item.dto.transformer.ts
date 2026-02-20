import { plainToInstance } from "class-transformer";
import { NestedUpdateInventoryAreaItemDto } from "../../dto/inventory-area-item/nested-update-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../../dto/inventory-area-item/update-inventory-area-item.dto";
import { InventoryAreaItem } from "../../entities/inventory-area-item.entity";

export function inventoryAreaItemToUpdateDto(inventoryAreaItem: InventoryAreaItem): UpdateInventoryAreaItemDto {
    return plainToInstance(UpdateInventoryAreaItemDto, {
        countedInventoryItemId: inventoryAreaItem.countedInventoryItem.id,
        amount: inventoryAreaItem.amount,
        countedItemSizeId: inventoryAreaItem.countedItemSize?.id,
        //countedItemSize: inventoryAreaItem.countedItemSize ? inventoryItemSizeToNestedUpdateDto(inventoryAreaItem.countedItemSize) : undefined,
    });
}

export function inventoryAreaItemToNestedUpdateDto(inventoryAreaItem: InventoryAreaItem): NestedUpdateInventoryAreaItemDto {
    return plainToInstance(NestedUpdateInventoryAreaItemDto, {
        id: inventoryAreaItem.id,
        countedInventoryItemId: inventoryAreaItem.countedInventoryItem.id,
        amount: inventoryAreaItem.amount,
        countedItemSizeId: inventoryAreaItem.countedItemSize?.id,
        //countedItemSize: inventoryAreaItem.countedItemSize ? inventoryItemSizeToNestedUpdateDto(inventoryAreaItem.countedItemSize) : undefined,
    });
}