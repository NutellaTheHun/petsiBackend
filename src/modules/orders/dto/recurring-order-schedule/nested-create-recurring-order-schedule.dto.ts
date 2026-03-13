import { NestedCreateDto } from "../../../../common/base/nested-create-dto.base";

export class NestedCreateRecurringOrderScheduleDto extends NestedCreateDto {
    readonly frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
    readonly interval?: number
    readonly daysOfWeek?: number[]
    readonly dayOfMonth?: number
    readonly monthOfYear?: number
    readonly startDate?: Date
    readonly endDate?: Date
    readonly timezone?: string
}