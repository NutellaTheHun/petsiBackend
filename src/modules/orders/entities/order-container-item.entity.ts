import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { OrderMenuItem } from './order-menu-item.entity';

/**
 * When a {@link OrderMenuItem} is representing a {@link MenuItem} that is a container of other {@link MenuItem}, the contained items
 * are expressed in {@link OrderContainerItem}
 */
@Entity()
export class OrderContainerItem {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The parent {@link OrderMenuItem} that represents the ordering of a {@link MenuItem}, where the ordered item is a container of other items.
   *
   * Example: Box of 6 Scones is the {@link parentOrderItem} of the {@link containedItem} { Lemon Glaze, size: regular, quantity: 6 }
   */
  @ApiProperty({
    example: {},
    description: 'The OrderMenuItem that is the container for this item',
    type: () => OrderMenuItem,
  })
  @ManyToOne(() => OrderMenuItem, (parent) => parent.orderedContainerItems, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  parentOrderItem: OrderMenuItem;

  /**
   * The {@link MenuItem} within the {@link parentOrderItem} that is being ordered.
   *
   * Example: Within the parent {@link menuItem} Breakfast Pastry Platter, size: small, one of the {@link containedItem} would be a Blueberry muffin, size regular, quantity 2.
   */
  @ApiProperty({
    example: {},
    description: 'The MenuItem being contained',
    type: MenuItem,
  })
  @ManyToOne(() => MenuItem, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  containedItem: MenuItem;

  /**
   * The {@link MenuItemSize} of the {@link containedItem} within the {@link parentOrderItem}.
   *
   * Example: containedItem: Blueberry muffin, containedSize: regular ...
   */
  @ApiProperty({
    example: {},
    description: 'The size of the contained MenuItem',
    type: MenuItemSize,
  })
  @ManyToOne(() => MenuItemSize, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  containedItemSize: MenuItemSize;

  @ApiProperty({
    example: '2',
    description: 'The amount of the contained MenuItem being ordered',
  })
  @Column({ nullable: false })
  quantity: number;
}
