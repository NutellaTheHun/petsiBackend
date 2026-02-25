import { plainToInstance } from "class-transformer";
import { NestedUpdateInventoryItemSizeDto } from "../../dto/inventory-item-size/nested-update-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../../dto/inventory-item-size/update-inventory-item-size.dto";
import { InventoryItemSize } from "../../entities/inventory-item-size.entity";

export function inventoryItemSizeToUpdateDto(inventoryItemSize: InventoryItemSize, merge: Partial<UpdateInventoryItemSizeDto> = {}): UpdateInventoryItemSizeDto {
    return plainToInstance(UpdateInventoryItemSizeDto, {
        packageId: inventoryItemSize.package.id,
        measureTypeId: inventoryItemSize.measureType.id,
        measureAmount: inventoryItemSize.measureAmount,
        cost: inventoryItemSize.cost ? parseFloat(inventoryItemSize.cost) : null,
        ...merge,
    });
}

export function inventoryItemSizeToNestedUpdateDto(inventoryItemSize: InventoryItemSize, merge: Partial<NestedUpdateInventoryItemSizeDto> = {}): NestedUpdateInventoryItemSizeDto {
    return plainToInstance(NestedUpdateInventoryItemSizeDto, {
        id: inventoryItemSize.id,
        packageId: inventoryItemSize.package.id,
        measureTypeId: inventoryItemSize.measureType.id,
        measureAmount: inventoryItemSize.measureAmount,
        cost: inventoryItemSize.cost ? parseFloat(inventoryItemSize.cost) : null,
        ...merge,
    });
}