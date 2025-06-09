import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { menuItemSizeExample } from '../../../util/swagger-examples/menu-items/menu-item-size.example';
import { menuItemExample } from '../../../util/swagger-examples/menu-items/menu-item.example';
import { orderContainerItemExample } from '../../../util/swagger-examples/orders/order-container-item.example';
import { orderExample } from '../../../util/swagger-examples/orders/order.example';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { OrderContainerItem } from './order-container-item.entity';
import { Order } from './order.entity';

/**
 * A {@link MenuItem} specified with a quantity and {@link MenuItemSize} on an {@link Order}.
 */
@Entity()
export class OrderMenuItem {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The parent {@link Order} of the item.
   */
  @ApiProperty({
    example: orderExample(new Set<string>(), true),
    description: 'The Order this ordered item is on',
    type: () => Order,
  })
  @ManyToOne(() => Order, (order) => order.orderedItems, {
    orphanedRowAction: 'delete',
    nullable: false,
    onDelete: 'CASCADE',
  })
  order: Order;

  /**
   * The {@link MenuItem} being bought.
   * - Example: "Classic Apple", "Blueberry Muffin", "Large T-shirt", "Box of 6 Scones"
   */
  @ApiProperty({
    example: menuItemExample(new Set<string>(), true),
    description: 'The MenuItem being ordered',
    type: MenuItem,
  })
  @ManyToOne(() => MenuItem, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: true,
  })
  menuItem: MenuItem;

  /**
   * The amount of the {@link MenuItem} / {@link MenuItemSize} combination being bought.
   */
  @ApiProperty({
    example: 3,
    description: 'The amount of the MenuItem being ordered',
  })
  @Column({ nullable: false })
  quantity: number;

  /**
   * The {@link MenuItemSize} of the {@link MenuItem} being bought,
   * - Example: "small", "medium", "large", "cold", "hot", "regular"
   */
  @ApiProperty({
    example: menuItemSizeExample(new Set<string>(), false),
    description: 'The size of the ordered MenuItem',
    type: MenuItemSize,
  })
  @ManyToOne(() => MenuItemSize, { nullable: false, eager: true })
  size: MenuItemSize;

  @ApiProperty({
    example: [orderContainerItemExample(new Set<string>(), false)],
    description:
      'If the ordered MenuItem is a container, the contained items will be listed here',
    type: () => OrderContainerItem,
    isArray: true,
  })
  @OneToMany(
    () => OrderContainerItem,
    (orderItem) => orderItem.parentOrderItem,
    { cascade: true, eager: true },
  )
  orderedContainerItems: OrderContainerItem[];
}
