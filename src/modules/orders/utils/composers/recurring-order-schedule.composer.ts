import { EntityManager } from "typeorm";
import { ComposerBase } from "../../../../common/base/composer.base";
import { ResolverContext } from "../../../../common/types/resolver-context.type";
import { CreateRecurringOrderScheduleDto } from "../../dto/recurring-order-schedule/create-recurring-order-schedule.dto";
import { NestedCreateRecurringOrderScheduleDto } from "../../dto/recurring-order-schedule/nested-create-recurring-order-schedule.dto";
import { UpdateRecurringOrderScheduleDto } from "../../dto/recurring-order-schedule/update-recurring-order-schedule.dto";
import { RecurringOrderSchedule, RecurringOrderScheduleEntity } from "../../entities/recurring-order-schedule.entity";

export class RecurringOrderScheduleComposer extends ComposerBase<RecurringOrderScheduleEntity> {

    protected readonly entityClass = RecurringOrderSchedule;

    constructor() {
        super();
    }

    protected async createInTransaction(dto: CreateRecurringOrderScheduleDto, manager: EntityManager): Promise<RecurringOrderSchedule> {

        const rruleString = this.buildRruleString(dto);

        const result = manager.create(RecurringOrderSchedule, {
            order: { id: dto.orderId },
            rrule: rruleString,
            startDate: dto.startDate,
            endDate: dto.endDate,
            timezone: dto.timezone,
        });
        return await manager.save(result);
    }

    protected async updateInTransaction(dto: UpdateRecurringOrderScheduleDto, manager: EntityManager, entity: RecurringOrderSchedule): Promise<void> {

        entity.rrule = this.buildRruleString(dto);

        if (dto.startDate !== undefined) {
            entity.startDate = dto.startDate;
        }
        if (dto.endDate !== undefined) {
            entity.endDate = dto.endDate;
        }
        if (dto.timezone !== undefined) {
            entity.timezone = dto.timezone;
        }

        await manager.save(entity);
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

    private getDayOfWeekValue(daysOfWeek: number[]): string {
        // convert dto number (0-6) to string (SU, MO, TU, WE, TH, FR, SA)
        return daysOfWeek.map(day => {
            switch (day) {
                case 0: return 'SU';
                case 1: return 'MO';
                case 2: return 'TU';
                case 3: return 'WE';
                case 4: return 'TH';
                case 5: return 'FR';
                case 6: return 'SA';
                default: throw new Error(`Invalid day of week: ${day}`);
            }
        }).join(',');
    }

    private buildRruleString(dto: CreateRecurringOrderScheduleDto | UpdateRecurringOrderScheduleDto): string {
        const parts: string[] = [];
        if (dto.frequency) {
            parts.push(`FREQ=${dto.frequency.toUpperCase()}`);
        }
        if (dto.interval) {
            parts.push(`INTERVAL=${dto.interval}`);
        }
        if (dto.daysOfWeek) {
            const dayOfWeekVal = this.getDayOfWeekValue(dto.daysOfWeek);
            parts.push(`BYDAY=${dayOfWeekVal}`);
        }
        if (dto.dayOfMonth) {
            parts.push(`BYMONTHDAY=${dto.dayOfMonth}`);
        }
        if (dto.monthOfYear) {
            parts.push(`BYMONTH=${dto.monthOfYear}`);
        }
        if (dto.startDate) {
            parts.push(`DTSTART=${dto.startDate}`);
        }
        if (dto.endDate) {
            parts.push(`UNTIL=${dto.endDate}`);
        }
        if (dto.timezone) {
            parts.push(`TIMEZONE=${dto.timezone}`);
        }

        return parts.join(';');
    }
}