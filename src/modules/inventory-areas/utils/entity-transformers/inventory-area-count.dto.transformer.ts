import { plainToInstance } from "class-transformer";
import { UpdateInventoryAreaCountDto } from "../../dto/inventory-area-count/update-inventory-area-count.dto";
import { InventoryAreaCount } from "../../entities/inventory-area-count.entity";
import { inventoryAreaItemToNestedUpdateDto } from "./inventory-area-item.dto.transformer";

export function inventoryAreaCountToUpdateDto(inventoryAreaCount: InventoryAreaCount, merge: Partial<UpdateInventoryAreaCountDto> = {}): UpdateInventoryAreaCountDto {
    const existingInventoryItems = inventoryAreaCount.countedInventoryItems.map(inventoryAreaItem => inventoryAreaItemToNestedUpdateDto(inventoryAreaItem)) ?? [];

    const mergedInventoryItems = merge.countedInventoryItems ? [...merge.countedInventoryItems, ...existingInventoryItems,] : existingInventoryItems;
    return plainToInstance(UpdateInventoryAreaCountDto, {
        inventoryAreaId: inventoryAreaCount.inventoryArea.id,
        ...merge,
        countedInventoryItems: mergedInventoryItems,
    });
}