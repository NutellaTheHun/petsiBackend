import { plainToInstance } from "class-transformer";
import { UpdateInventoryItemCategoryDto } from "../../dto/inventory-item-category/update-inventory-item-category.dto";
import { InventoryItemCategory } from "../../entities/inventory-item-category.entity";

export function inventoryItemCategoryToUpdateDto(inventoryItemCategory: InventoryItemCategory, merge: Partial<UpdateInventoryItemCategoryDto> = {}): UpdateInventoryItemCategoryDto {
    return plainToInstance(UpdateInventoryItemCategoryDto, {
        name: inventoryItemCategory.name,
        ...merge,
    });
}