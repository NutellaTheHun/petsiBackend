import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { rrulestr } from 'rrule';
import { Repository } from 'typeorm';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { OCCURRENCE_STATES, OCCURRENCE_TYPES } from '../utils/occurence-types';

/** Days ahead to materialize generated occurrence orders. */
const RECURRENCE_HORIZON_DAYS = 45;

const TEMPLATE_ORDER_RELATIONS = [
    'recurrenceSchedule',
    'category',
    'orderedItems',
    'orderedItems.containerOrderMenuItems',
] as const;

/**
 * Handles the generation and regeneration of recurring Order entities with its recurrence order schedule entity.
 * Orders that occur on a repeated basis are called a template order, hold a recurringOrderSchedule entity called recurrenceSchedule, and are of occurenceType TEMPLATE, and a null occurrenceState.
 * Orders that are generated from a template order are called occurences, hold a recurrenceDate property, are of occurenceType OCCURRENCE, and can be occurenceState GENERATED, MODIFIED, or CANCELLED, and a templateOrderId which represents the template order that generated the occurence.
 * This service is responsible for generating and regenerating occurences from a template order.
 * For now, the horizon date should be 45 days from the current date.
 */
@Injectable()
export class OrderRecurrenceService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
    ) {}

    /**
     * Generates occurences for all template orders that have a recurrenceSchedule entity.
     */
    @Cron(CronExpression.EVERY_HOUR)
    protected async generateRecurringOrders(): Promise<void> {
        const templates = await this.orderRepo.find({
            where: { occurrenceType: OCCURRENCE_TYPES.TEMPLATE },
            relations: ['recurrenceSchedule'],
        });

        const horizon = addDays(startOfDayLocal(new Date()), RECURRENCE_HORIZON_DAYS);

        for (const t of templates) {
            if (!t.recurrenceSchedule) continue;
            const full = await this.loadTemplateWithRelations(t.id);
            if (!full) continue;
            await this.handleTemplateFulfillmentDate(full);
            await this.ensureGeneratedOrders(full, horizon);
        }
    }

    /**
     * Ensures that all occurences for a template order are generated up to the horizon date based on its recurrenceDate.
     * @param templateOrder The template order that is being generated from.
     * @param horizonDate The date to generate occurences up to.
     */
    protected async ensureGeneratedOrders(templateOrder: Order, horizonDate: Date): Promise<void> {
        if (!templateOrder.recurrenceSchedule?.rrule) return;
        if (!templateOrder.orderedItems?.length) return;

        const anchor = templateOrder.recurrenceDate ?? templateOrder.fulfillmentDate;
        const rrule = templateOrder.recurrenceSchedule.rrule;

        let next = this.nextOccurence(rrule, anchor);
        while (next.getTime() <= horizonDate.getTime()) {
            if (sameCalendarDayLocal(next, templateOrder.fulfillmentDate)) {
                next = this.nextOccurence(rrule, next);
                continue;
            }

            const exists = await this.orderRepo.exist({
                where: {
                    templateOrderId: templateOrder.id,
                    recurrenceDate: next,
                },
            });
            if (!exists) {
                const clone = this.cloneTemplateToOccurence(templateOrder, next);
                await this.orderRepo.save(clone);
            }

            next = this.nextOccurence(rrule, next);
        }
    }

    /**
     * Removes all occurences for a template order that are after the start date.
     * @param templateOrder The template order that is being removed from.
     * @param startDate The date to remove occurences on or after (inclusive).
     */
    protected async removeFutureGeneratedOrders(templateOrder: Order, startDate: Date): Promise<void> {
        await this.orderRepo
            .createQueryBuilder()
            .delete()
            .from(Order)
            .where('templateOrderId = :tid', { tid: templateOrder.id })
            .andWhere('occurrenceType = :ot', { ot: OCCURRENCE_TYPES.OCCURRENCE })
            .andWhere('occurrenceState = :os', { os: OCCURRENCE_STATES.GENERATED })
            .andWhere('recurrenceDate >= :sd', { sd: startDate })
            .execute();
    }

    /**
     * Calculates the next occurence date for a template order based on its rrule string and start date.
     * @param rrule The rrule string of the template order.
     * @param startDate The start date of the template order.
     */
    protected nextOccurence(rrule: string, startDate: Date): Date {
        const rule = rrulestr(rrule);
        const next = rule.after(startDate, false);
        if (!next) {
            throw new Error('No future occurrences for rrule');
        }
        return next;
    }

    /**
     * Returns a deep copy of a template order at a given date.
     * @param templateOrder The template order that is being cloned.
     * @param occurenceDate The date to clone the order's fulfillment and recurrence dates to.
     */
    protected cloneTemplateToOccurence(templateOrder: Order, occurenceDate: Date): Order {
        const m = this.orderRepo.manager;

        const clone = m.create(Order, {
            recipient: templateOrder.recipient,
            fulfillmentDate: occurenceDate,
            recurrenceDate: occurenceDate,
            fulfillmentType: templateOrder.fulfillmentType,
            fulfillmentContactName: templateOrder.fulfillmentContactName,
            deliveryAddress: templateOrder.deliveryAddress,
            phoneNumber: templateOrder.phoneNumber,
            email: templateOrder.email,
            note: templateOrder.note,
            isFrozen: templateOrder.isFrozen,
            category: templateOrder.category ? { id: templateOrder.category.id } : null,
            occurrenceType: OCCURRENCE_TYPES.OCCURRENCE,
            occurrenceState: OCCURRENCE_STATES.GENERATED,
            templateOrderId: templateOrder.id,
            recurrenceSchedule: null,
        });

        clone.orderedItems = (templateOrder.orderedItems ?? []).map((omi) =>
            m.create(OrderMenuItem, {
                menuItem: { id: omi.menuItem.id },
                size: omi.size ? { id: omi.size.id } : null,
                quantity: omi.quantity,
                containerOrderMenuItems: (omi.containerOrderMenuItems ?? []).map((c) =>
                    m.create(OrderContainerItem, {
                        containedMenuItem: { id: c.containedMenuItem.id },
                        containedItemSize: { id: c.containedItemSize.id },
                        quantity: c.quantity,
                    }),
                ),
            }),
        );

        return clone;
    }

    /**
     * Regenerates a template order
     * @param templateOrderId
     */
    public async handleTemplateOrderUpdate(templateOrderId: number): Promise<void> {
        const templateOrder = await this.loadTemplateWithRelations(templateOrderId);
        if (!templateOrder?.recurrenceSchedule) return;

        await this.handleTemplateFulfillmentDate(templateOrder);
        const startFrom = startOfDayLocal(new Date());
        await this.removeFutureGeneratedOrders(templateOrder, startFrom);
        const horizon = addDays(startOfDayLocal(new Date()), RECURRENCE_HORIZON_DAYS);
        await this.ensureGeneratedOrders(templateOrder, horizon);
    }

    /**
     * If the template orders fulfillment date is before the current date, the templates fulfillment date is set to the next occurence date.
     * @param templateOrder
     */
    protected async handleTemplateFulfillmentDate(templateOrder: Order): Promise<void> {
        if (!templateOrder.recurrenceSchedule?.rrule) return;

        const today = startOfDayLocal(new Date());
        const fulfillmentDay = startOfDayLocal(new Date(templateOrder.fulfillmentDate));
        if (fulfillmentDay.getTime() >= today.getTime()) return;

        const next = this.nextOccurence(templateOrder.recurrenceSchedule.rrule, today);
        templateOrder.fulfillmentDate = next;
        await this.orderRepo.save(templateOrder);
    }

    private async loadTemplateWithRelations(id: number): Promise<Order | null> {
        return this.orderRepo.findOne({
            where: { id },
            relations: [...TEMPLATE_ORDER_RELATIONS],
        });
    }
}

function startOfDayLocal(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function addDays(d: Date, n: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

function sameCalendarDayLocal(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}
