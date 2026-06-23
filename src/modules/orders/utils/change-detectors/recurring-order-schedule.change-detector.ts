import { Injectable } from '@nestjs/common';
import {
    ChangeDetectionResult,
    ChangeDetectorChange,
    ChangeDetectorBase,
    MutablePartial,
} from '../../../../common/base/change-detector.base';
import { NestedUpdateRecurringOrderScheduleDto } from '../../dto/recurring-order-schedule/nested-update-recurring-order-schedule.dto';
import { RecurringOrderSchedule } from '../../entities/recurring-order-schedule.entity';
import { recurringOrderScheduleToUpdateDto } from '../entity-transformers/recurring-order-schedule.dto.transformer';

@Injectable()
export class RecurringOrderScheduleChangeDetector extends ChangeDetectorBase<
    RecurringOrderSchedule,
    NestedUpdateRecurringOrderScheduleDto
> {
    public detect(
        entity: RecurringOrderSchedule,
        dto: NestedUpdateRecurringOrderScheduleDto,
    ): ChangeDetectionResult<NestedUpdateRecurringOrderScheduleDto> {
        const existingDto = recurringOrderScheduleToUpdateDto(entity);
        const patch: MutablePartial<NestedUpdateRecurringOrderScheduleDto> = {
            id: dto.id,
        };
        const changes: ChangeDetectorChange[] = [];

        if (!this.unchanged(existingDto.frequency, dto.frequency)) {
            patch.frequency = dto.frequency;
            changes.push({
                op: 'scalar',
                path: 'frequency',
                previousValue: existingDto.frequency,
                nextValue: dto.frequency,
            });
        }

        if (!this.unchanged(existingDto.interval, dto.interval)) {
            patch.interval = dto.interval;
            changes.push({
                op: 'scalar',
                path: 'interval',
                previousValue: existingDto.interval,
                nextValue: dto.interval,
            });
        }

        if (!this.sameNumberArray(existingDto.daysOfWeek, dto.daysOfWeek)) {
            patch.daysOfWeek = dto.daysOfWeek;
            changes.push({
                op: 'aggregate',
                path: 'daysOfWeek',
                previousValue: existingDto.daysOfWeek,
                nextValue: dto.daysOfWeek,
            });
        }

        if (!this.unchanged(existingDto.dayOfMonth, dto.dayOfMonth)) {
            patch.dayOfMonth = dto.dayOfMonth;
            changes.push({
                op: 'scalar',
                path: 'dayOfMonth',
                previousValue: existingDto.dayOfMonth,
                nextValue: dto.dayOfMonth,
            });
        }

        if (!this.unchanged(existingDto.monthOfYear, dto.monthOfYear)) {
            patch.monthOfYear = dto.monthOfYear;
            changes.push({
                op: 'scalar',
                path: 'monthOfYear',
                previousValue: existingDto.monthOfYear,
                nextValue: dto.monthOfYear,
            });
        }

        if (!this.sameDate(existingDto.startDate, dto.startDate)) {
            patch.startDate = dto.startDate;
            changes.push({
                op: 'scalar',
                path: 'startDate',
                previousValue: existingDto.startDate,
                nextValue: dto.startDate,
            });
        }

        if (!this.sameDate(existingDto.endDate ?? null, dto.endDate ?? null)) {
            patch.endDate = dto.endDate;
            changes.push({
                op: 'scalar',
                path: 'endDate',
                previousValue: existingDto.endDate,
                nextValue: dto.endDate,
            });
        }

        if (!this.unchanged(existingDto.timezone, dto.timezone)) {
            patch.timezone = dto.timezone;
            changes.push({
                op: 'scalar',
                path: 'timezone',
                previousValue: existingDto.timezone,
                nextValue: dto.timezone,
            });
        }

        return {
            patch,
            changes,
            hasChanges: changes.length > 0,
        };
    }
}
