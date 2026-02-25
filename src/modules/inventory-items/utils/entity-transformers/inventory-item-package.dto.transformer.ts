import { plainToInstance } from "class-transformer";
import { UpdateInventoryItemPackageDto } from "../../dto/inventory-item-package/update-inventory-item-package.dto";
import { InventoryItemPackage } from "../../entities/inventory-item-package.entity";

export function inventoryItemPackageToUpdateDto(inventoryItemPackage: InventoryItemPackage, merge: Partial<UpdateInventoryItemPackageDto> = {}): UpdateInventoryItemPackageDto {
    return plainToInstance(UpdateInventoryItemPackageDto, {
        name: inventoryItemPackage.name,
        ...merge,
    });
}