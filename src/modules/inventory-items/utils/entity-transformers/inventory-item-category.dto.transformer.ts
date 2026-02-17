import { UpdateInventoryItemCategoryDto } from "../../dto/inventory-item-category/update-inventory-item-category.dto";
import { InventoryItemCategory } from "../../entities/inventory-item-category.entity";

export function inventoryItemCategoryToUpdateDto(inventoryItemCategory: InventoryItemCategory): UpdateInventoryItemCategoryDto {
    return {
        name: inventoryItemCategory.name,
    };
}