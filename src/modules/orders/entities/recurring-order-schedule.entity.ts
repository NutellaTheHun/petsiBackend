import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";

@Entity()
export class RecurringOrderSchedule {
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the order that this schedule is for',
    })
    @OneToOne(() => Order, (order) => order.reccurenceSchedule)
    @JoinColumn()
    order: Order;

    @ApiProperty({
        example: 'RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR',
        description: 'The rrule string for the schedule',
    })
    @Column({ type: 'varchar' })
    rrule: string;

    @ApiProperty({
        example: '2025-01-01',
        description: 'The start date of the schedule',
    })
    @Column()
    startDate: Date;

    @ApiProperty({
        example: '2025-01-01',
        description: 'The end date of the schedule',
        nullable: true,
    })
    @Column({ nullable: true })
    endDate?: Date | null = null;
}