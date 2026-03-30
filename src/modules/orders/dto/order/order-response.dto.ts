import { ApiProperty } from "@nestjs/swagger";
import { OrderCategory } from "../../entities/order-category.entity";
import { OrderMenuItem } from "../../entities/order-menu-item.entity";
import { RecurringOrderScheduleResponseDto } from "../recurring-order-schedule/recurring-order-schedule-response.dto";

export class OrderResponseDto {
    @ApiProperty({
        description: 'The unique identifier of the entity',
        example: 1,
        type: 'number',
    })
    id: number;

    @ApiProperty({
        description: 'Name of the owner of the order',
        example: 'John Smith',
        type: 'string',
    })
    readonly recipient: string;

    @ApiProperty({
        description: 'Date the order is to be available or delivered.',
        example: '2025-06-08T20:26:45.883Z',
        type: 'string',
    })
    readonly fulfillmentDate: Date;

    @ApiProperty({
        description: "Method of Order's dispersal.",
        example: 'delivery',
        type: 'string',
    })
    readonly fulfillmentType: string;

    @ApiProperty({
        description: 'Name of who is picking up the order or reciving the delivery',
        example: 'Jane Doe',
        type: 'string',
        nullable: true,
    })
    readonly fulfillmentContactName?: string | null;

    @ApiProperty({
        description: 'for delivery contact information',
        example: '123 main st',
        type: 'string',
        nullable: true,
    })
    readonly deliveryAddress?: string | null;

    @ApiProperty({
        description: 'for delivery contact information',
        example: '1234568',
        type: 'string',
        nullable: true,
    })
    readonly phoneNumber?: string | null;

    @ApiProperty({
        description: 'for delivery contact information',
        example: 'email@email.com',
        type: 'string',
        format: 'email',
        nullable: true,
    })
    readonly email?: string | null;

    @ApiProperty({
        description: 'special instruction for order',
        example: 'note information',
        type: 'string',
        nullable: true,
    })
    readonly note?: string | null;

    @ApiProperty({
        description:
            'A frozen order is inactive and is not included for typical buisness logic opeations. Not included in aggregates or reports.',
        example: false,
        type: 'boolean',
    })
    readonly isFrozen: boolean;

    @ApiProperty({
        description: 'Id of OrderType entity.',
        example: 1,
        type: 'number',
    })
    readonly category?: OrderCategory | null;

    @ApiProperty({
        description: 'TODO',
        type: OrderMenuItem,
        example: [
            {
                id: 1,
                menuItem: {
                    id: 2,
                    name: 'Test Menu Item',
                },
                sizeId: 3,
                quantity: 4,
            },
            {
                id: 5,
                menuItem: {
                    id: 6,
                    name: 'Another test Menu Item',
                },
                sizeId: 7,
                quantity: 8,
            },
        ],
    })
    readonly orderedItems?: OrderMenuItem[];

    @ApiProperty({
        example: 'TEMPLATE',
        description: 'The type of the occurence',
        type: 'string',
        nullable: true,
    })
    readonly occurrenceType?: string | null;

    @ApiProperty({
        example: 'GENERATED',
        description: 'The state of the occurence',
        type: 'string',
        nullable: true,
    })
    readonly occurrenceState?: string | null;

    @ApiProperty({
        example: {
            frequency: 'WEEKLY',
            interval: 1,
            daysOfWeek: [0, 1, 2, 3, 4],
            dayOfMonth: 1,
            monthOfYear: 1,
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-01-01'),
            timezone: 'America/New_York',
        },
        description: 'The schedule of the recurring order',
        type: () => RecurringOrderScheduleResponseDto,
    })
    readonly recurrenceSchedule?: RecurringOrderScheduleResponseDto;

    @ApiProperty({
        description: 'The date the order was created in the DB',
        example: '2025-06-06T19:22:07.102Z',
        type: 'string',
    })
    readonly createdAt: Date;

    @ApiProperty({
        description: 'The date the order was last modified.',
        example: '2025-06-06T19:22:07.102Z',
        type: 'string',
    })
    readonly updatedAt: Date;
}