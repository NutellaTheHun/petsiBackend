import { Injectable } from '@nestjs/common';
import {
    ChangeDetectionResult,
    ChangeDetectorChange,
    ChangeDetectorBase,
    MutablePartial,
} from '../../../../common/base/change-detector.base';
import { NestedCreateOrderMenuItemDto } from '../../dto/order-menu-item/nested-create-order-menu-item.dto';
import { NestedUpdateOrderMenuItemDto } from '../../dto/order-menu-item/nested-update-order-menu-item.dto';
import { UpdateOrderDto } from '../../dto/order/update-order.dto';
import { NestedCreateRecurringOrderScheduleDto } from '../../dto/recurring-order-schedule/nested-create-recurring-order-schedule.dto';
import { NestedUpdateRecurringOrderScheduleDto } from '../../dto/recurring-order-schedule/nested-update-recurring-order-schedule.dto';
import { OrderMenuItem } from '../../entities/order-menu-item.entity';
import { Order } from '../../entities/order.entity';
import { RecurringOrderSchedule } from '../../entities/recurring-order-schedule.entity';
import { OrderMenuItemChangeDetector } from './order-menu-item.change-detector';
import { RecurringOrderScheduleChangeDetector } from './recurring-order-schedule.change-detector';

type NestedOrderMenuItemDto =
    | NestedCreateOrderMenuItemDto
    | NestedUpdateOrderMenuItemDto;

type NestedRecurrenceScheduleDto =
    | NestedCreateRecurringOrderScheduleDto
    | NestedUpdateRecurringOrderScheduleDto
    | null;

@Injectable()
export class OrderChangeDetector extends ChangeDetectorBase<Order, UpdateOrderDto> {
    constructor(
        private readonly orderMenuItemChangeDetector: OrderMenuItemChangeDetector,
        private readonly recurringOrderScheduleChangeDetector: RecurringOrderScheduleChangeDetector,
    ) {
        super();
    }

    public detect(entity: Order, dto: UpdateOrderDto): ChangeDetectionResult<UpdateOrderDto> {
        const patch: MutablePartial<UpdateOrderDto> = {};
        const changes: ChangeDetectorChange[] = [];

        if (!this.unchanged(entity.recipient, dto.recipient)) {
            patch.recipient = dto.recipient;
            changes.push({
                op: 'scalar',
                path: 'recipient',
                previousValue: entity.recipient,
                nextValue: dto.recipient,
            });
        }

        if (!this.sameDate(entity.fulfillmentDate, dto.fulfillmentDate)) {
            patch.fulfillmentDate = dto.fulfillmentDate;
            changes.push({
                op: 'scalar',
                path: 'fulfillmentDate',
                previousValue: entity.fulfillmentDate,
                nextValue: dto.fulfillmentDate,
            });
        }

        if (!this.unchanged(entity.fulfillmentType, dto.fulfillmentType)) {
            patch.fulfillmentType = dto.fulfillmentType;
            changes.push({
                op: 'scalar',
                path: 'fulfillmentType',
                previousValue: entity.fulfillmentType,
                nextValue: dto.fulfillmentType,
            });
        }

        if (!this.unchanged(entity.fulfillmentContactName, dto.fulfillmentContactName)) {
            patch.fulfillmentContactName = dto.fulfillmentContactName;
            changes.push({
                op: 'scalar',
                path: 'fulfillmentContactName',
                previousValue: entity.fulfillmentContactName,
                nextValue: dto.fulfillmentContactName,
            });
        }

        if (!this.unchanged(entity.deliveryAddress, dto.deliveryAddress)) {
            patch.deliveryAddress = dto.deliveryAddress;
            changes.push({
                op: 'scalar',
                path: 'deliveryAddress',
                previousValue: entity.deliveryAddress,
                nextValue: dto.deliveryAddress,
            });
        }

        if (!this.unchanged(entity.phoneNumber, dto.phoneNumber)) {
            patch.phoneNumber = dto.phoneNumber;
            changes.push({
                op: 'scalar',
                path: 'phoneNumber',
                previousValue: entity.phoneNumber,
                nextValue: dto.phoneNumber,
            });
        }

        if (!this.unchanged(entity.email, dto.email)) {
            patch.email = dto.email;
            changes.push({
                op: 'scalar',
                path: 'email',
                previousValue: entity.email,
                nextValue: dto.email,
            });
        }

        if (!this.unchanged(entity.note, dto.note)) {
            patch.note = dto.note;
            changes.push({
                op: 'scalar',
                path: 'note',
                previousValue: entity.note,
                nextValue: dto.note,
            });
        }

        if (!this.unchanged(entity.isFrozen, dto.isFrozen)) {
            patch.isFrozen = dto.isFrozen;
            changes.push({
                op: 'scalar',
                path: 'isFrozen',
                previousValue: entity.isFrozen,
                nextValue: dto.isFrozen,
            });
        }

        if (!this.unchanged(entity.category?.id, dto.categoryId)) {
            patch.categoryId = dto.categoryId;
            changes.push({
                op: 'reference',
                path: 'categoryId',
                previousValue: entity.category?.id,
                nextValue: dto.categoryId,
            });
        }

        if (!this.unchanged(entity.occurrenceType ?? null, dto.occurrenceType ?? null)) {
            patch.occurrenceType = dto.occurrenceType;
            changes.push({
                op: 'scalar',
                path: 'occurrenceType',
                previousValue: entity.occurrenceType ?? null,
                nextValue: dto.occurrenceType ?? null,
            });
        }

        if (!this.unchanged(entity.occurrenceState ?? null, dto.occurrenceState ?? null)) {
            patch.occurrenceState = dto.occurrenceState;
            changes.push({
                op: 'scalar',
                path: 'occurrenceState',
                previousValue: entity.occurrenceState ?? null,
                nextValue: dto.occurrenceState ?? null,
            });
        }

        const orderedItemsPatch = this.detectOrderedItems(
            entity.orderedItems ?? [],
            dto.orderedItems,
        );
        if (orderedItemsPatch !== undefined) {
            patch.orderedItems = orderedItemsPatch;
            changes.push({
                op: 'aggregate',
                path: 'orderedItems',
                previousValue: entity.orderedItems?.map((item) => item.id) ?? [],
                nextValue: orderedItemsPatch,
            });
        }

        const recurrenceSchedulePatch = this.detectRecurringSchedule(
            entity.recurrenceSchedule ?? null,
            dto.recurrenceSchedule,
        );
        if (recurrenceSchedulePatch !== undefined) {
            patch.recurrenceSchedule = recurrenceSchedulePatch;
            changes.push({
                op: 'reference',
                path: 'recurrenceSchedule',
                previousValue: entity.recurrenceSchedule?.id ?? null,
                nextValue: recurrenceSchedulePatch,
            });
        }

        return {
            patch,
            changes,
            hasChanges: changes.length > 0,
        };
    }

    /**
     * When `incoming` is undefined, nested lines are unchanged.
     * When present, the list is authoritative: patch is the full incoming array when anything differs.
     */
    private detectOrderedItems(
        existingItems: OrderMenuItem[],
        incoming?: NestedOrderMenuItemDto[],
    ): NestedOrderMenuItemDto[] | undefined {
        if (incoming === undefined) {
            return undefined;
        }

        const existingById = new Map<number, OrderMenuItem>();
        for (const existingItem of existingItems) {
            existingById.set(existingItem.id, existingItem);
        }

        const prevIds = existingItems.map((i) => i.id);
        const nextIdSet = new Set(
            incoming
                .filter((d): d is NestedUpdateOrderMenuItemDto => 'id' in d)
                .map((d) => d.id),
        );
        const removed = prevIds.some((id) => !nextIdSet.has(id));
        const added = incoming.some((d) => 'createId' in d);

        let needsFullReplace = removed || added;
        if (!needsFullReplace) {
            for (const dto of incoming) {
                if ('createId' in dto) {
                    needsFullReplace = true;
                    break;
                }
                const existingItem = existingById.get(dto.id);
                if (!existingItem) {
                    needsFullReplace = true;
                    break;
                }
                const childResult = this.orderMenuItemChangeDetector.detect(
                    existingItem,
                    dto,
                );
                if (childResult.hasChanges) {
                    needsFullReplace = true;
                    break;
                }
            }
        }

        if (!needsFullReplace) {
            return undefined;
        }

        return incoming;
    }

    private detectRecurringSchedule(
        existingSchedule: RecurringOrderSchedule | null,
        incomingSchedule?: NestedRecurrenceScheduleDto,
    ): NestedRecurrenceScheduleDto | undefined {
        if (incomingSchedule === undefined) {
            return undefined;
        }

        if (incomingSchedule === null) {
            return existingSchedule ? null : undefined;
        }

        if ('createId' in incomingSchedule) {
            return incomingSchedule;
        }

        if (!existingSchedule) {
            return incomingSchedule;
        }

        const childResult = this.recurringOrderScheduleChangeDetector.detect(
            existingSchedule,
            incomingSchedule,
        );

        if (!childResult.hasChanges) {
            return undefined;
        }

        // Keep full nested schedule dto when changed since composer rebuilds RRULE
        // from required schedule fields (e.g. startDate).
        return incomingSchedule;
    }
}
