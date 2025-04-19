import { CreateInventoryItemSizeDto } from "../dto/create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../dto/update-inventory-item-size.dto";

export function InventoryItemSizeUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateInventoryItemSizeDto;
    return CreateInventoryItemSizeDto;
}