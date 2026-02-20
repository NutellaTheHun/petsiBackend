import { NestedUpdateOrderMenuItemDto } from "../../dto/order-menu-item/nested-update-order-menu-item.dto";
import { UpdateOrderMenuItemDto } from "../../dto/order-menu-item/update-order-menu-item.dto";
import { OrderMenuItem } from "../../entities/order-menu-item.entity";
import { orderContainerItemToNestedUpdateDto } from "./order-container-item.dto.transformer";

export function orderMenuItemToUpdateDto(orderMenuItem: OrderMenuItem): UpdateOrderMenuItemDto {
    return {
        menuItemId: orderMenuItem.menuItem.id,
        sizeId: orderMenuItem.size.id,
        quantity: orderMenuItem.quantity,
        containerOrderMenuItems: orderMenuItem.containerOrderMenuItems?.map(containerItem => orderContainerItemToNestedUpdateDto(containerItem)) ?? [],
    };
}

export function orderMenuItemToNestedUpdateDto(orderMenuItem: OrderMenuItem): NestedUpdateOrderMenuItemDto {
    return {
        id: orderMenuItem.id,
        menuItemId: orderMenuItem.menuItem.id,
        sizeId: orderMenuItem.size.id,
        quantity: orderMenuItem.quantity,
        containerOrderMenuItems: orderMenuItem.containerOrderMenuItems?.map(containerItem => orderContainerItemToNestedUpdateDto(containerItem)) ?? [],
    };
}