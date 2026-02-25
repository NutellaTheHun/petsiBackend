import { plainToInstance } from "class-transformer";
import { UpdateInventoryItemDto } from "../../dto/inventory-item/update-inventory-item.dto";
import { InventoryItem } from "../../entities/inventory-item.entity";
import { inventoryItemSizeToNestedUpdateDto } from "./inventory-item-size.dto.transformer";

export function inventoryItemToUpdateDto(inventoryItem: InventoryItem, merge: Partial<UpdateInventoryItemDto> = {}): UpdateInventoryItemDto {
    const existingSizes = inventoryItem.sizes.map(size => inventoryItemSizeToNestedUpdateDto(size)) ?? [];
    const mergedSizes = merge.sizes ? [...existingSizes, ...merge.sizes] : existingSizes;

    return plainToInstance(UpdateInventoryItemDto, {
        name: inventoryItem.name,
        categoryId: inventoryItem.category?.id ?? null,
        vendorId: inventoryItem.vendor?.id ?? null,
        ...merge,
        sizes: mergedSizes,
    });
}