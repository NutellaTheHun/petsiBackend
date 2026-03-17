import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { orderCategoryExample } from '../../../common/swagger/examples/orders/order-category.example';
import { orderMenuItemExample } from '../../../common/swagger/examples/orders/order-menu-item.example';
import { recurringOrderScheduleExample } from '../../../common/swagger/examples/orders/recurring-order-schedule.example';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OCCURENCE_STATES, OCCURENCE_TYPES, OccurenceState, OccurenceType } from '../utils/occurence-types';
import { OrderCategory } from './order-category.entity';
import { OrderMenuItem } from './order-menu-item.entity';
import { RecurringOrderSchedule } from './recurring-order-schedule.entity';

export type OrderEntity = EntityBase<Order, CreateOrderDto, UpdateOrderDto>;


/**
 * A list of {@link OrderMenuItem} and fullfilment information, facilitating the purchasing of {@link MenuItem}.
 */
@Entity('orders')
@Unique(['templateOrderId', 'reccurenceDate'])
export class Order {
    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the entity',
    })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({
        example: '2025-06-06T19:22:07.102Z',
        description: 'The date the order was created in the DB',
    })
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty({
        example: '2025-06-06T19:22:07.102Z',
        description: 'The date the order was last modified.',
    })
    @UpdateDateColumn()
    updatedAt: Date;

    /**
     * Name of the owner of the order, such as the name of a person or buisness.
     */
    @ApiProperty({
        example: 'Cassandra del Apocalypto',
        description: 'The name of the owner of the order',
    })
    @Column()
    recipient: string;

    /**
     * The date that the order is due.
     */
    @ApiProperty({
        example: '2025-06-06T19:22:07.102Z',
        description: 'The date the order is due to be picked up or delivered.',
    })
    @Column()
    fulfillmentDate: Date;

    /**
     * Pickup or delivery
     */
    @ApiProperty({
        example: 'pickup',
        description:
            'The method of transferring the order to the recipient/fulfillmentContactName (pickup or delivery)',
    })
    @Column()
    fulfillmentType: string;

    /**
     * Name of the point person to recieve the delivery.
     *
     * Sometimes different from the recipient/owner of the order
     */
    @ApiProperty({
        example: 'Marcus Bolognese',
        description:
            "If the order is for delivery and the recipient property isn't who is recieving the order",
        nullable: true,
        type: 'string',
    })
    @Column({ nullable: true, type: 'varchar' })
    fulfillmentContactName: string | null = null;

    /**
     * Only required for orders with fulfillment type delivery
     */
    @ApiProperty({
        example: '1 Broken Dreams Blvd',
        description: 'If a delivery order, that address to deliver',
        nullable: true,
        type: 'string',
    })
    @Column({ nullable: true, type: 'varchar' })
    deliveryAddress: string | null = null;

    /**
     * Only required for orders with fulfillment type delivery
     */
    @ApiProperty({
        example: '555-420-6969',
        description: 'Phone number associated with order',
        nullable: true,
        type: 'string',
    })
    @Column({ nullable: true, type: 'varchar' })
    phoneNumber: string | null = null;

    /**
     * Only required for orders with fulfillment type delivery
     */
    @ApiProperty({
        example: 'email@email.com',
        description: 'email associated with order',
        nullable: true,
        type: 'string',
        format: 'email',
    })
    @Column({ nullable: true, type: 'varchar' })
    email: string | null = null;

    /**
     * Any additional information for the order.
     */
    @ApiPropertyOptional({
        example: 'This is a note',
        description: 'an extra information regarding the order',
        nullable: true,
        type: 'string',
    })
    @Column({ nullable: true, type: 'varchar' })
    note: string | null = null;

    /**
     * If an order is frozen, it is not an active order,
     *
     * will not be aggregated in various actions like report creation,
     * and list population (except when viewing frozen orders exclusively)
     */
    @ApiProperty({
        example: true,
        description:
            "A flag to 'pause' or 'freeze' an order, not included in DB queries for services like aggregates for Reports.",
    })
    @Column({ default: false })
    isFrozen: boolean = false;

    /**
     * The category of order
     * - Example: "Wholesale", "Special", "Square", "Farmers Market"
     */
    @ApiProperty({
        example: orderCategoryExample(new Set<string>(), true),
        description: 'The assigned category of the order',
        type: () => OrderCategory,
    })
    @ManyToOne(() => OrderCategory, { nullable: true, onDelete: 'SET NULL' })
    category: OrderCategory | null = null;

    /**
     * The list of {@link OrderMenuItem} that are being purchased.
     */
    @ApiProperty({
        example: [orderMenuItemExample(new Set<string>(), false)],
        description:
            'If the ordered MenuItem is a container, the contained items will be populated here',
        type: () => OrderMenuItem,
        isArray: true,
    })
    @OneToMany(() => OrderMenuItem, (item) => item.parentOrder, { cascade: true })
    orderedItems: OrderMenuItem[];

    @ApiProperty({
        example: recurringOrderScheduleExample(new Set<string>(), false),
        description: 'The schedule of the recurring order',
        type: () => RecurringOrderSchedule,
        nullable: true,
    })
    @OneToOne(() => RecurringOrderSchedule, (schedule) => schedule.order, { nullable: true, onDelete: 'SET NULL' })
    reccurenceSchedule?: RecurringOrderSchedule | null = null;

    @ApiProperty({
        example: 'TEMPLATE',
        description: 'The type of the occurence',
        type: 'string',
    })
    @Column({ nullable: true, type: 'enum', enum: Object.values(OCCURENCE_TYPES), default: null })
    occurenceType?: OccurenceType | null = null;

    @ApiProperty({
        example: 'GENERATED',
        description: 'The state of the occurence',
        type: 'string',
    })
    @Column({ nullable: true, type: 'enum', enum: Object.values(OCCURENCE_STATES), default: null })
    occurenceState?: OccurenceState | null = null;

    @ApiProperty({
        example: '2025-01-01',
        description: 'The original of the occurence, used to properly regenerated orders',
    })
    @Column({ nullable: true })
    reccurenceDate?: Date | null = null;

    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the template order that this occurence is based on',
        type: 'number',
        nullable: true,
    })
    @Column({ nullable: true, type: 'int' })
    templateOrderId?: number | null = null;
}
