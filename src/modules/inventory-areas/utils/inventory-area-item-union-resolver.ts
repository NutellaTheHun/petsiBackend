import { CreateInventoryAreaItemDto } from "../dto/create-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/update-inventory-area-item-count.dto";

export function InventoryAreaItemUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateInventoryAreaItemDto;
    return CreateInventoryAreaItemDto;
}