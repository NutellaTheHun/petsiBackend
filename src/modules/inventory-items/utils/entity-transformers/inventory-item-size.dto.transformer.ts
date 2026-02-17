import { NestedUpdateInventoryItemSizeDto } from "../../dto/inventory-item-size/nested-update-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../../dto/inventory-item-size/update-inventory-item-size.dto";
import { InventoryItemSize } from "../../entities/inventory-item-size.entity";

export function inventoryItemSizeToUpdateDto(inventoryItemSize: InventoryItemSize): UpdateInventoryItemSizeDto {
    return {
        packageId: inventoryItemSize.package.id,
        measureTypeId: inventoryItemSize.measureType.id,
        measureAmount: inventoryItemSize.measureAmount,
        cost: inventoryItemSize.cost ? parseFloat(inventoryItemSize.cost) : undefined,
    };
}

export function inventoryItemSizeToNestedUpdateDto(inventoryItemSize: InventoryItemSize): NestedUpdateInventoryItemSizeDto {
    return {
        id: inventoryItemSize.id,
        packageId: inventoryItemSize.package.id,
        measureTypeId: inventoryItemSize.measureType.id,
        measureAmount: inventoryItemSize.measureAmount,
        cost: inventoryItemSize.cost ? parseFloat(inventoryItemSize.cost) : undefined,
    };
}