import { plainToInstance } from "class-transformer";
import { UpdateInventoryItemDto } from "../../dto/inventory-item/update-inventory-item.dto";
import { InventoryItem } from "../../entities/inventory-item.entity";
import { inventoryItemSizeToNestedUpdateDto } from "./inventory-item-size.dto.transformer";

export function inventoryItemToUpdateDto(inventoryItem: InventoryItem): UpdateInventoryItemDto {
    return plainToInstance(UpdateInventoryItemDto, {
        name: inventoryItem.name,
        categoryId: inventoryItem.category?.id ?? null,
        vendorId: inventoryItem.vendor?.id ?? null,
        sizes: inventoryItem.sizes.map(size => inventoryItemSizeToNestedUpdateDto(size)),
    });
}