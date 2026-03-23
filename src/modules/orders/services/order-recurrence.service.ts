import { Injectable, NotImplementedException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Order } from "../entities/order.entity";
import { RecurringOrderSchedule } from "../entities/recurring-order-schedule.entity";

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

        @InjectRepository(RecurringOrderSchedule)
        private readonly recurringOrderScheduleRepo: Repository<RecurringOrderSchedule>,
    ) {

    }

    /**
     * Generates occurences for all template orders that have a recurrenceSchedule entity.
     */
    @Cron(CronExpression.EVERY_HOUR)
    protected generateRecurringOrders() {
        /**
         * Query all orders that are of occurenceType TEMPLATE, and have a recurrenceSchedule entity,
         * make sure all template Order fulfillmentDate are up to date
         * ensure all occurences are generated up to the horizon date.
         */
    }

    /**
     * Ensures that all occurences for a template order are generated up to the horizon date based on its recurrenceDate.
     * @param templateOrder The template order that is being generated from.
     * @param horizonDate The date to generate occurences up to.
     */
    protected async ensureGeneratedOrders(templateOrder: Order, horizonDate: Date): Promise<void> {
        /**
         * Given a template order and a horizon date,
         * get all future occurence orders generated from that template order,
         * from current day to the horizon date, 
         * calculate the next occurence
         * if there is no occurence order that has a recurrenceDate that equals the next occurence, generate the occurence
         */
    }

    /**
     * Removes all occurences for a template order that are after the start date.
     * @param templateOrder The template order that is being removed from.
     * @param startDate The date to remove occurences after.
     */
    protected async removeFutureGeneratedOrders(templateOrder: Order, startDate: Date): Promise<void> {
        /**
         * Given a template order and a start date,
         * get all occurence orders generated from that template order, that are of occurenceState GENERATED, (not MODIFIED or CANCELLED)
         * that are after the start date,
         * remove the occurence orders
         */
    }

    /**
     * Calculates the next occurence date for a template order based on its rrule string and start date.
     * @param rrule The rrule string of the template order.
     * @param startDate The start date of the template order.
     */
    protected nextOccurence(rrule: string, startDate: Date): Date {
        throw new NotImplementedException
    }

    /**
     * Clones a template order to an occurence order at a given date.
     * @param templateOrder The template order that is being cloned.
     * @param occurenceDate The date to clone the template order to.
     */
    protected cloneTemplateToOccurence(templateOrder: Order, occurenceDate: Date): Order {
        throw new NotImplementedException
        /**
         * cloned order must be a deep copy of the template order, capturing its relations and properties. Especially orderMenuItem down to orderContainerItem.
         * cloned order must have all of the same properties as the template order, except for the following properties which are overridden:
         * occurrenceType: OCCURRENCE
         * occurrenceState: GENERATED
         * recurrenceDate: occurenceDate
         * templateOrderId: templateOrder.id
         * fulfillmentDate: occurenceDate
         * recurrenceSchedule: null
         */
    }

    /**
     * Regenerates a template order
     * @param templateOrder 
     */
    public async handleTemplateOrderUpdate(templateOrder: Order): Promise<void> {
        /**
         * Given a template order,
         * handle the template orders fulfillment date (handleTemplateFulfillmentDate())
         * remove all occurences for the template order that are after the start date (removeFutureGeneratedOrders())
         * ensure that all occurences for the template order are generated up to the horizon date based on its recurrenceDate (ensureGeneratedOrders())
         */
    }

    /**
     * If the template orders fulfillment date is before the current date, the templates fulfillment date is set to the next occurence date.
     * @param templateOrder 
     */
    protected handleTemplateFulfillmentDate(templateOrder: Order): void {
        /**
         * Given a template order,
         * if the template orders fulfillment date is before the current date, set the templates fulfillment date to the next occurence date 
         */
    }
}