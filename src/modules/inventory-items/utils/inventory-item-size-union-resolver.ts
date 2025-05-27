import { CreateChildInventoryItemSizeDto } from "../dto/inventory-item-size/create-child-inventory-item-size.dto";
import { UpdateChildInventoryItemSizeDto } from "../dto/inventory-item-size/update-child-inventory-item-size.dto";

export function InventoryItemSizeUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateChildInventoryItemSizeDto;
    return CreateChildInventoryItemSizeDto;
}