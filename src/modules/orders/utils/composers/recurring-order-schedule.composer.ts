import { EntityManager } from "typeorm";
import { ComposerBase } from "../../../../common/base/composer.base";
import { ResolverContext } from "../../../../common/types/resolver-context.type";
import { CreateRecurringOrderScheduleDto } from "../../dto/recurring-order-schedule/create-recurring-order-schedule.dto";
import { NestedCreateRecurringOrderScheduleDto } from "../../dto/recurring-order-schedule/nested-create-recurring-order-schedule.dto";
import { UpdateRecurringOrderScheduleDto } from "../../dto/recurring-order-schedule/update-recurring-order-schedule.dto";
import { RecurringOrderSchedule, RecurringOrderScheduleEntity } from "../../entities/recurring-order-schedule.entity";
import { buildRRULEDateString, buildRruleString } from "../rrule.util";

export class RecurringOrderScheduleComposer extends ComposerBase<RecurringOrderScheduleEntity> {

    protected readonly entityClass = RecurringOrderSchedule;

    constructor() {
        super();
    }

    protected async createInTransaction(dto: CreateRecurringOrderScheduleDto, manager: EntityManager): Promise<RecurringOrderSchedule> {

        const rruleString = `${buildRRULEDateString(dto.startDate)}\n${buildRruleString(dto)}`;

        const result = manager.create(RecurringOrderSchedule, {
            order: { id: dto.orderId },
            rrule: rruleString,
            startDate: dto.startDate,
            endDate: dto.endDate,
            timezone: dto.timezone,
        });
        return result;
    }

    protected async updateInTransaction(dto: UpdateRecurringOrderScheduleDto, manager: EntityManager, entity: RecurringOrderSchedule): Promise<void> {

        entity.rrule = `${buildRRULEDateString(dto.startDate)}\n${buildRruleString(dto)}`;

        if (dto.startDate !== undefined) {
            entity.startDate = dto.startDate;
        }
        if (dto.endDate !== undefined) {
            entity.endDate = dto.endDate;
        }
        if (dto.timezone !== undefined) {
            entity.timezone = dto.timezone;
        }

    }

    protected resolveCreateDto(dto: NestedCreateRecurringOrderScheduleDto, context?: ResolverContext): CreateRecurringOrderScheduleDto {
        if (!context?.orderId) {
            throw new Error('Order id is required');
        }
        return {
            orderId: context.orderId,
            frequency: dto.frequency,
            interval: dto.interval,
            daysOfWeek: dto.daysOfWeek,
            dayOfMonth: dto.dayOfMonth,
            monthOfYear: dto.monthOfYear,
            startDate: dto.startDate,
            endDate: dto.endDate,
            timezone: dto.timezone,
        };
    }
}