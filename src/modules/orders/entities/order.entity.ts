import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityBase } from '../../../base/entity-base';
import { orderCategoryExample } from '../../../util/swagger-examples/orders/order-category.example';
import { orderMenuItemExample } from '../../../util/swagger-examples/orders/order-menu-item.example';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderCategory } from './order-category.entity';
import { OrderMenuItem } from './order-menu-item.entity';

export type OrderEntity = EntityBase<Order, CreateOrderDto, UpdateOrderDto>;

/**
 * A list of {@link OrderMenuItem} and fullfilment information, facilitating the purchasing of {@link MenuItem}.
 */
@Entity('orders')
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
   * If an order occurs weekly (such as most wholesale orders),
   *
   * this flag ensures that its aggregation is calculated appropriately.
   *
   * Most orders will be isWeekly=false (A "one-shot" order, most orders are done after fulfillment).
   */
  @ApiProperty({
    example: '',
    description:
      'A flag if a order occurs on a weekly basis. A traditional order has isWeekly=false (upon fulfillment the order is completed, while a wholesale standing order could occur every thursday)',
  })
  @Column({ default: false })
  isWeekly: boolean = false;

  /**
   * If an order is weekly, the day of the week the order is fulfilled.
   */
  @ApiProperty({
    example: 'tuesday',
    description:
      'If the order isWeekly is set to true, the day of the week the order is fulfilled on.',
    nullable: true,
    type: 'string',
  })
  @Column({ nullable: true, type: 'varchar' })
  weeklyFulfillment: string | null = null;

  /**
   * The category of order
   * - Example: "Wholesale", "Special", "Square", "Farmers Market"
   */
  @ApiProperty({
    example: orderCategoryExample(new Set<string>(), true),
    description: 'The assigned category of the order',
    type: () => OrderCategory,
  })
  @ManyToOne(() => OrderCategory)
  category: OrderCategory;

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
  orderedItems: OrderMenuItem[] = [];
}
