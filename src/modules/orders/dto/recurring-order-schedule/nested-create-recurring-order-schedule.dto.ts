import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsDate,
    IsDateString,
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';
import {
    RECURRENCE_FREQUENCIES,
    RECURRENCE_TIMEZONES,
} from '../../utils/recurrence-options';
import { NestedCreateDto } from '../../../../common/base/nested-create-dto.base';

export class NestedCreateRecurringOrderScheduleDto extends NestedCreateDto {
    @ApiProperty({
        enum: RECURRENCE_FREQUENCIES,
        description: 'The frequency of the schedule',
        example: 'WEEKLY',
    })
    @IsString()
    @IsNotEmpty()
    @IsIn(RECURRENCE_FREQUENCIES)
    readonly frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

    @ApiProperty({
        description: 'The interval of the schedule',
        example: 1,
        nullable: true,
    })
    @IsNumber()
    @IsOptional()
    readonly interval?: number;

    @ApiProperty({
        description:
            'The days of the week that the schedule is active, values between 0-6',
        example: [0, 1, 2, 3, 4],
        nullable: true,
    })
    @IsArray()
    @IsOptional()
    @IsNumber({}, { each: true })
    readonly daysOfWeek?: number[];

    @ApiProperty({
        description:
            'The day of the month that the schedule is active, values between 1-31',
        example: 1,
        nullable: true,
    })
    @IsNumber()
    @IsOptional()
    readonly dayOfMonth?: number;

    @ApiProperty({
        description:
            'The month of the year that the schedule is active, values between 1-12',
        example: 1,
        nullable: true,
    })
    @IsNumber()
    @IsOptional()
    readonly monthOfYear?: number;

    @ApiProperty({
        description:
            'The start date of the schedule, maps to DTSTART in the rrule string',
        example: '2026-03-17T15:58:22.212Z',
    })
    @IsDate()
    @IsNotEmpty()
    @IsDateString()
    readonly startDate: Date;

    @ApiProperty({
        description:
            'The end date of the schedule, maps to UNTIL in the rrule string',
        example: '2026-03-17T15:58:22.212Z',
        nullable: true,
    })
    @IsDate()
    @IsOptional()
    @IsDateString()
    readonly endDate?: Date;

    @ApiProperty({
        enum: RECURRENCE_TIMEZONES,
        description:
            'The timezone of the schedule, maps to TZID in the rrule string, defaults to America/New_York',
        example: 'America/New_York',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    @IsString()
    @IsIn(RECURRENCE_TIMEZONES)
    readonly timezone?: string;
}
