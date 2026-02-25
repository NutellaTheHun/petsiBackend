import { plainToInstance } from "class-transformer";
import { NestedUpdateOrderMenuItemDto } from "../../dto/order-menu-item/nested-update-order-menu-item.dto";
import { UpdateOrderMenuItemDto } from "../../dto/order-menu-item/update-order-menu-item.dto";
import { OrderMenuItem } from "../../entities/order-menu-item.entity";
import { orderContainerItemToNestedUpdateDto } from "./order-container-item.dto.transformer";

export function orderMenuItemToUpdateDto(orderMenuItem: OrderMenuItem, merge: Partial<UpdateOrderMenuItemDto> = {}): UpdateOrderMenuItemDto {
    const existingContainerItems = orderMenuItem.containerOrderMenuItems?.map(containerItem => orderContainerItemToNestedUpdateDto(containerItem)) ?? [];
    const mergedContainerItems = merge.containerOrderMenuItems ? [...existingContainerItems, ...merge.containerOrderMenuItems] : existingContainerItems;

    return plainToInstance(UpdateOrderMenuItemDto, {
        menuItemId: orderMenuItem.menuItem.id,
        sizeId: orderMenuItem.size?.id ?? null,
        quantity: orderMenuItem.quantity,
        ...merge,
        containerOrderMenuItems: mergedContainerItems,
    });
}

export function orderMenuItemToNestedUpdateDto(orderMenuItem: OrderMenuItem, merge: Partial<NestedUpdateOrderMenuItemDto> = {}): NestedUpdateOrderMenuItemDto {
    const existingContainerItems = orderMenuItem.containerOrderMenuItems?.map(containerItem => orderContainerItemToNestedUpdateDto(containerItem)) ?? [];
    const mergedContainerItems = merge.containerOrderMenuItems ? [...existingContainerItems, ...merge.containerOrderMenuItems] : existingContainerItems;

    return plainToInstance(NestedUpdateOrderMenuItemDto, {
        id: orderMenuItem.id,
        menuItemId: orderMenuItem.menuItem.id,
        sizeId: orderMenuItem.size?.id ?? null,
        quantity: orderMenuItem.quantity,
        ...merge,
        containerOrderMenuItems: mergedContainerItems,
    });
}