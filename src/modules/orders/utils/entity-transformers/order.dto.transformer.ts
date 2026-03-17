import { plainToInstance } from "class-transformer";
import { UpdateOrderDto } from "../../dto/order/update-order.dto";
import { Order } from "../../entities/order.entity";
import { orderMenuItemToNestedUpdateDto } from "./order-menu-item.dto.transformer";
import { recurringOrderScheduleToCreateDto } from "./recurring-order-schedule.dto.transformer";

export function orderToUpdateDto(order: Order, merge: Partial<UpdateOrderDto> = {}): UpdateOrderDto {
    const existingOrderedItems = order.orderedItems.map(item => orderMenuItemToNestedUpdateDto(item)) ?? [];
    const mergedOrderedItems = merge.orderedItems ? [...merge.orderedItems, ...existingOrderedItems] : existingOrderedItems;
    const mergedRecurrenceSchedule = recurringOrderScheduleToCreateDto(order.reccurenceSchedule, merge.recurrenceSchedule ?? {});

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
        occurenceType: order.occurenceType ?? undefined,
        occurenceState: order.occurenceState ?? undefined,
        reccurenceDate: order.reccurenceDate ?? undefined,
        templateOrderId: order.templateOrderId ?? undefined,
        ...merge,
        orderedItems: mergedOrderedItems,
        recurrenceSchedule: mergedRecurrenceSchedule,
    });
}
