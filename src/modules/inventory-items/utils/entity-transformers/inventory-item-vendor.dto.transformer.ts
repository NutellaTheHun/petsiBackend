import { UpdateInventoryItemVendorDto } from "../../dto/inventory-item-vendor/update-inventory-item-vendor.dto";
import { InventoryItemVendor } from "../../entities/inventory-item-vendor.entity";

export function inventoryItemVendorToUpdateDto(inventoryItemVendor: InventoryItemVendor): UpdateInventoryItemVendorDto {
    return {
        name: inventoryItemVendor.name,
    };
}