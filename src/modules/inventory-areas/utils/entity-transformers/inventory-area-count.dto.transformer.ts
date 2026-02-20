import { plainToInstance } from "class-transformer";
import { UpdateInventoryAreaCountDto } from "../../dto/inventory-area-count/update-inventory-area-count.dto";
import { InventoryAreaCount } from "../../entities/inventory-area-count.entity";
import { inventoryAreaItemToNestedUpdateDto } from "./inventory-area-item.dto.transformer";

export function inventoryAreaCountToUpdateDto(inventoryAreaCount: InventoryAreaCount): UpdateInventoryAreaCountDto {
    return plainToInstance(UpdateInventoryAreaCountDto, {
        inventoryAreaId: inventoryAreaCount.inventoryArea.id,
        countedInventoryItems: inventoryAreaCount.countedInventoryItems.map(inventoryAreaItem => inventoryAreaItemToNestedUpdateDto(inventoryAreaItem)),
    });
}