import { CreateChildInventoryItemSizeDto } from "../dto/create-child-inventory-item-size.dto";
import { UpdateChildInventoryItemSizeDto } from "../dto/update-child-inventory-item-size.dto";

export function InventoryItemSizeUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateChildInventoryItemSizeDto;
    return CreateChildInventoryItemSizeDto;
}