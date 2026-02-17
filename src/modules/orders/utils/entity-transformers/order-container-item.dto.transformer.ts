import { NestedUpdateOrderContainerItemDto } from "../../dto/order-container-item/nested-update-order-container-item.dto";
import { UpdateOrderContainerItemDto } from "../../dto/order-container-item/update-order-container-item.dto";
import { OrderContainerItem } from "../../entities/order-container-item.entity";

export function orderContainerItemToUpdateDto(orderContainerItem: OrderContainerItem): UpdateOrderContainerItemDto {
    return {
        containedMenuItemId: orderContainerItem.containedMenuItem.id,
        containedItemSizeId: orderContainerItem.containedItemSize.id,
        quantity: orderContainerItem.quantity,
    };
}

export function orderContainerItemToNestedUpdateDto(orderContainerItem: OrderContainerItem): NestedUpdateOrderContainerItemDto {
    return {
        id: orderContainerItem.id,
        containedMenuItemId: orderContainerItem.containedMenuItem.id,
        containedItemSizeId: orderContainerItem.containedItemSize.id,
        quantity: orderContainerItem.quantity,
    };
}