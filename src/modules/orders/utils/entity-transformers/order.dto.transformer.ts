import { plainToInstance } from "class-transformer";
import { OrderResponseDto } from "../../dto/order/order-response.dto";
import { UpdateOrderDto } from "../../dto/order/update-order.dto";
import { Order } from "../../entities/order.entity";
import { orderMenuItemToNestedUpdateDto } from "./order-menu-item.dto.transformer";
import { recurringOrderScheduleToResponseDto, recurringOrderScheduleToUpdateDto } from "./recurring-order-schedule.dto.transformer";

export function orderToUpdateDto(order: Order, merge: Partial<UpdateOrderDto> = {}): UpdateOrderDto {
    const existingOrderedItems = order.orderedItems.map(item => orderMenuItemToNestedUpdateDto(item)) ?? [];
    const mergedOrderedItems = merge.orderedItems ? [...merge.orderedItems, ...existingOrderedItems] : existingOrderedItems;
    const mergedRecurrenceSchedule = merge.recurrenceSchedule !== undefined ? merge.recurrenceSchedule : order.recurrenceSchedule ? recurringOrderScheduleToUpdateDto(order.recurrenceSchedule) : undefined;

    return plainToInstance(UpdateOrderDto, {
        recipient: order.recipient,
        fulfillmentDate: order.fulfillmentDate,
        fulfillmentType: order.fulfillmentType,
        fulfillmentContactName: order.fulfillmentContactName ?? undefined,
        deliveryAddress: order.deliveryAddress ?? undefined,
        phoneNumber: order.phoneNumber ?? undefined,
        email: order.email ?? undefined,
        note: order.note ?? undefined,
        isFrozen: order.isFrozen ?? undefined,
        categoryId: order.category?.id ?? null,
        occurrenceType: order.occurrenceType ?? undefined,
        occurrenceState: order.occurrenceState ?? undefined,
        reccurenceDate: order.recurrenceDate ?? undefined,
        templateOrderId: order.templateOrderId ?? undefined,
        ...merge,
        orderedItems: mergedOrderedItems,
        recurrenceSchedule: mergedRecurrenceSchedule,
    });
}

export function orderToResponseDto(order: Order): OrderResponseDto {
    return plainToInstance(OrderResponseDto, {
        ...order,
        recurrenceSchedule: order.recurrenceSchedule ? recurringOrderScheduleToResponseDto(order.recurrenceSchedule) : undefined,
    });
}
