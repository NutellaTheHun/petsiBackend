import { CreateChildInventoryAreaItemDto } from "../dto/create-child-inventory-area-item.dto";
import { UpdateChildInventoryAreaItemDto } from "../dto/update-child-inventory-area-item.dto";

export function InventoryAreaItemUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateChildInventoryAreaItemDto;
    return CreateChildInventoryAreaItemDto;
}