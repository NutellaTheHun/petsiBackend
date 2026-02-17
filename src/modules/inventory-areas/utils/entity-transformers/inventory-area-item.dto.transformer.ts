import { inventoryItemSizeToNestedUpdateDto } from "../../../inventory-items/utils/entity-transformers/inventory-item-size.dto.transformer";
import { NestedUpdateInventoryAreaItemDto } from "../../dto/inventory-area-item/nested-update-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../../dto/inventory-area-item/update-inventory-area-item.dto";
import { InventoryAreaItem } from "../../entities/inventory-area-item.entity";

export function inventoryAreaItemToUpdateDto(inventoryAreaItem: InventoryAreaItem): UpdateInventoryAreaItemDto {
    return {
        countedInventoryItemId: inventoryAreaItem.countedInventoryItem.id,
        amount: inventoryAreaItem.amount,
        countedItemSizeId: inventoryAreaItem.countedItemSize?.id,
        countedItemSize: inventoryAreaItem.countedItemSize ? inventoryItemSizeToNestedUpdateDto(inventoryAreaItem.countedItemSize) : undefined,
    };
}

export function inventoryAreaItemToNestedUpdateDto(inventoryAreaItem: InventoryAreaItem): NestedUpdateInventoryAreaItemDto {
    return {
        id: inventoryAreaItem.id,
        countedInventoryItemId: inventoryAreaItem.countedInventoryItem.id,
        amount: inventoryAreaItem.amount,
        countedItemSizeId: inventoryAreaItem.countedItemSize?.id,
        countedItemSize: inventoryAreaItem.countedItemSize ? inventoryItemSizeToNestedUpdateDto(inventoryAreaItem.countedItemSize) : undefined,
    };
}