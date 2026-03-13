import { NestedUpdateDto } from "../../../../common/base/nested-update-dto.base";

export class NestedUpdateRecurringOrderScheduleDto extends NestedUpdateDto {
    readonly frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
    readonly interval?: number
    readonly daysOfWeek?: number[]
    readonly dayOfMonth?: number
    readonly monthOfYear?: number
    readonly startDate?: Date
    readonly endDate?: Date
    readonly timezone?: string
}