import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { plainToInstance, Transform, TransformFnParams } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDate,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    ValidateNested
} from 'class-validator';
import { EntityId } from '../../../../common/types';
import { OrderCategory } from '../../entities/order-category.entity';
import { NestedCreateOrderMenuItemDto } from '../order-menu-item/nested-create-order-menu-item.dto';
import { NestedUpdateOrderMenuItemDto } from '../order-menu-item/nested-update-order-menu-item.dto';
import { NestedCreateRecurringOrderScheduleDto } from '../recurring-order-schedule/nested-create-recurring-order-schedule.dto';
import { NestedUpdateRecurringOrderScheduleDto } from '../recurring-order-schedule/nested-update-recurring-order-schedule.dto';

export class UpdateOrderDto {
    @ApiProperty({
        description: 'Name of the owner of the order',
        example: 'John Smith',
        type: 'string',
    })
    @IsString()
    @IsNotEmpty()
    readonly recipient: string;

    @ApiProperty({
        description: 'Date the order is to be available or delivered.',
        example: '2025-06-08T20:26:45.883Z',
        type: 'string',
    })
    @IsDate()
    @IsNotEmpty()
    readonly fulfillmentDate: Date;

    @ApiProperty({
        description: "Method of Order's dispersal.",
        example: 'delivery',
        type: 'string',
    })
    @IsString()
    @IsNotEmpty()
    readonly fulfillmentType: string;

    @ApiProperty({
        description: 'Name of who is picking up the order or reciving the delivery',
        example: 'Jane Doe',
        type: 'string',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    readonly fulfillmentContactName?: string | null;

    @ApiProperty({
        description: 'for delivery contact information',
        example: '123 main st',
        type: 'string',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    readonly deliveryAddress?: string | null;

    @ApiProperty({
        description: 'for delivery contact information',
        example: '1234568',
        type: 'string',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    readonly phoneNumber?: string | null;

    @ApiProperty({
        description: 'for delivery contact information',
        example: 'email@email.com',
        type: 'string',
        format: 'email',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    readonly email?: string | null;

    @ApiProperty({
        description: 'special instruction for order',
        example: 'note information',
        type: 'string',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    readonly note?: string | null;

    @ApiProperty({
        description:
            'A frozen order is inactive and is not included for typical buisness logic opeations. Not included in aggregates or reports.',
        example: false,
        type: 'boolean',
    })
    @IsBoolean()
    @IsNotEmpty()
    readonly isFrozen: boolean;

    @ApiProperty({
        description: 'Is true if the order occurs on a weekly basis.',
        example: true,
        type: 'boolean',
    })
    @IsBoolean()
    @IsNotEmpty()
    readonly isWeekly: boolean;

    @ApiProperty({
        description: 'If is weekly, is the day of the week the order is fulfilled',
        example: 'sunday',
        type: 'string',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    readonly weeklyFulfillment?: string | null;

    @ApiProperty({
        description: 'Id of OrderType entity.',
        example: 1,
        type: 'number',
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly categoryId: EntityId<OrderCategory>;

    @ApiProperty({
        description:
            'When present, replaces all line items for this order (authoritative). Omit to leave lines unchanged.',
        type: 'array',
        oneOf: [
            { $ref: getSchemaPath(NestedCreateOrderMenuItemDto) },
            { $ref: getSchemaPath(NestedUpdateOrderMenuItemDto) },
        ],
        example: [
            {
                createId: 'c1',
                menuItemId: 2,
                sizeId: 3,
                quantity: 4,
            },
            {
                id: 5,
                menuItemId: 6,
                sizeId: 7,
                quantity: 8,
            },
        ],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Transform(({ value }: TransformFnParams) => {
        if (!Array.isArray(value)) return value;
        return value.map((item: any) =>
            'createId' in item && item.createId !== undefined
                ? plainToInstance(NestedCreateOrderMenuItemDto, item)
                : plainToInstance(NestedUpdateOrderMenuItemDto, item)
        );
    })
    readonly orderedItems?: (
        | NestedCreateOrderMenuItemDto
        | NestedUpdateOrderMenuItemDto
    )[];

    @ApiProperty({
        example: 'TEMPLATE',
        description: 'The type of the occurence',
        type: 'string',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    readonly occurrenceType?: string | null;

    @ApiProperty({
        example: 'GENERATED',
        description: 'The state of the occurence',
        type: 'string',
        nullable: true,
    })
    @IsString()
    @IsOptional()
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
        type: () => [NestedCreateRecurringOrderScheduleDto, NestedUpdateRecurringOrderScheduleDto],
        nullable: true,
    })
    @Transform(({ value }: TransformFnParams) => {
        if (value == null) return value; // handles null AND undefined

        if (typeof value === 'object' && 'createId' in value) {
            return plainToInstance(NestedCreateRecurringOrderScheduleDto, value);
        }

        return plainToInstance(NestedUpdateRecurringOrderScheduleDto, value);
    })
    readonly recurrenceSchedule?: NestedCreateRecurringOrderScheduleDto | NestedUpdateRecurringOrderScheduleDto | null;
}
