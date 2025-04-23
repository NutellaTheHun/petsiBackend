import { CreateOrderMenuItemDto } from "../dto/create-order-menu-item.dto";
import { UpdateOrderMenuItemDto } from "../dto/update-order-menu-item.dto";

export function OrderMenuItemUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateOrderMenuItemDto;
    return CreateOrderMenuItemDto;
}