import { CreateChildOrderMenuItemDto } from "../dto/order-menu-item/create-child-order-menu-item.dto";
import { UpdateChildOrderMenuItemDto } from "../dto/order-menu-item/update-child-order-menu-item.dto";

export function OrderMenuItemUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateChildOrderMenuItemDto;
    return CreateChildOrderMenuItemDto;
}