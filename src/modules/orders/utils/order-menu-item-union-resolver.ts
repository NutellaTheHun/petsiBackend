import { CreateOrderMenuItemDto } from "../dto/create-order-menu-item.dto";
import { UpdateChildOrderMenuItemDto } from "../dto/update-child-order-menu-item.dto";

export function OrderMenuItemUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateChildOrderMenuItemDto;
    return CreateOrderMenuItemDto;
}