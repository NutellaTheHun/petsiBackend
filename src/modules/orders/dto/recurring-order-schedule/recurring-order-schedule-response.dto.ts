import { ApiProperty } from "@nestjs/swagger";

export class RecurringOrderScheduleResponseDto {
    @ApiProperty({
        description: 'The unique identifier of the entity',
        example: 1,
        type: 'number',
    })
    id: number;

    @ApiProperty({
        description: 'The frequency of the schedule',
        example: 'WEEKLY',
    })
    readonly frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

    @ApiProperty({
        description: 'The interval of the schedule',
        example: 1,
        nullable: true,
    })
    readonly interval?: number | null;

    @ApiProperty({
        description: 'The days of the week that the schedule is active, values between 0-6',
        example: [0, 1, 2, 3, 4],
        nullable: true,
    })
    readonly daysOfWeek?: number[] | null;

    @ApiProperty({
        description: 'The day of the month that the schedule is active, values between 1-31',
        example: 1,
        nullable: true,
    })
    readonly dayOfMonth?: number

    @ApiProperty({
        description: 'The month of the year that the schedule is active, values between 1-12',
        example: 1,
        nullable: true,
    })
    readonly monthOfYear?: number

    @ApiProperty({
        description: 'The start date of the schedule, maps to DTSTART in the rrule string',
        example: '2026-03-17T15:58:22.212Z',
    })
    readonly startDate: Date

    @ApiProperty({
        description: 'The end date of the schedule, maps to UNTIL in the rrule string',
        example: '2026-03-17T15:58:22.212Z',
        nullable: true,
    })
    readonly endDate?: Date

    @ApiProperty({
        description: 'The timezone of the schedule, maps to TZID in the rrule string, defaults to America/New_York',
        example: 'America/New_York',
        nullable: true,
    })
    readonly timezone?: string
}