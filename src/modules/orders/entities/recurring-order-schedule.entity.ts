import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { NestedEntityBase } from "../../../common/base/entity.base";
import { CreateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/create-recurring-order-schedule.dto";
import { NestedCreateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/nested-create-recurring-order-schedule.dto";
import { NestedUpdateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/nested-update-recurring-order-schedule.dto";
import { UpdateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/update-recurring-order-schedule.dto";
import { Order } from "./order.entity";

export type RecurringOrderScheduleEntity = NestedEntityBase<
    RecurringOrderSchedule,
    CreateRecurringOrderScheduleDto,
    UpdateRecurringOrderScheduleDto,
    NestedCreateRecurringOrderScheduleDto,
    NestedUpdateRecurringOrderScheduleDto
>;

@Entity()
export class RecurringOrderSchedule {
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the order that this schedule is for',
    })
    @OneToOne(() => Order, (order) => order.reccurenceSchedule, { onDelete: 'CASCADE' })
    @JoinColumn()
    order: Order;

    @ApiProperty({
        example: 'RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR;DTSTART=2025-01-01;UNTIL=2025-01-01;TZID=America/New_York;',
        description: 'The rrule string for the schedule',
    })
    @Column({ type: 'varchar' })
    rrule: string;

    @ApiProperty({
        example: '2026-03-17T15:58:22.212Z',
        description: 'The start date of the schedule, maps to DTSTART in the rrule string',
    })
    @Column()
    startDate: Date;

    @ApiProperty({
        example: '2026-03-17T15:58:22.212Z',
        description: 'The end date of the schedule, maps to UNTIL in the rrule string',
        nullable: true,
    })
    @Column({ nullable: true })
    endDate?: Date | null = null;

    @ApiProperty({
        example: 'America/New_York',
        description: 'The timezone of the schedule, maps to TZID in the rrule string, defaults to America/New_York',
    })
    @Column({ nullable: true, default: 'America/New_York' })
    timezone: string;
}