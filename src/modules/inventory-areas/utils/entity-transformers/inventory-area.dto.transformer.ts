import { plainToInstance } from "class-transformer";
import { UpdateInventoryAreaDto } from "../../dto/inventory-area/update-inventory-area.dto";
import { InventoryArea } from "../../entities/inventory-area.entity";

export function inventoryAreaToUpdateDto(inventoryArea: InventoryArea): UpdateInventoryAreaDto {
    return plainToInstance(UpdateInventoryAreaDto, {
        name: inventoryArea.name,
    });
}