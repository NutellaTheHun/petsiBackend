import { plainToInstance } from "class-transformer";
import { NestedUpdateOrderContainerItemDto } from "../../dto/order-container-item/nested-update-order-container-item.dto";
import { UpdateOrderContainerItemDto } from "../../dto/order-container-item/update-order-container-item.dto";
import { OrderContainerItem } from "../../entities/order-container-item.entity";

export function orderContainerItemToUpdateDto(orderContainerItem: OrderContainerItem, merge: Partial<UpdateOrderContainerItemDto> = {}): UpdateOrderContainerItemDto {
    return plainToInstance(UpdateOrderContainerItemDto, {
        containedMenuItemId: orderContainerItem.containedMenuItem.id,
        containedItemSizeId: orderContainerItem.containedItemSize.id,
        quantity: orderContainerItem.quantity,
        ...merge,
    });
}

export function orderContainerItemToNestedUpdateDto(orderContainerItem: OrderContainerItem, merge: Partial<NestedUpdateOrderContainerItemDto> = {}): NestedUpdateOrderContainerItemDto {
    return plainToInstance(NestedUpdateOrderContainerItemDto, {
        id: orderContainerItem.id,
        containedMenuItemId: orderContainerItem.containedMenuItem.id,
        containedItemSizeId: orderContainerItem.containedItemSize.id,
        quantity: orderContainerItem.quantity,
        ...merge,
    });
}