import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { menuItemSizeExample } from '../../../common/swagger/examples/menu-items/menu-item-size.example';
import { menuItemExample } from '../../../common/swagger/examples/menu-items/menu-item.example';
import { orderMenuItemExample } from '../../../common/swagger/examples/orders/order-menu-item.example';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { NestedCreateOrderContainerItemDto } from '../dto/order-container-item/nested-create-order-container-item.dto';
import { NestedUpdateOrderContainerItemDto } from '../dto/order-container-item/nested-update-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import { OrderMenuItem } from './order-menu-item.entity';

export type OrderContainerItemEntity = EntityBase<
  OrderContainerItem,
  CreateOrderContainerItemDto,
  UpdateOrderContainerItemDto,
  NestedCreateOrderContainerItemDto,
  NestedUpdateOrderContainerItemDto
>;

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
   * The {@link MenuItem} within the {@link parentOrderMenuItem} that is being ordered.
   *
   * Example: Within the parent {@link menuItem} Breakfast Pastry Platter, size: small, one of the {@link containedMenuItem} would be a Blueberry muffin, size regular, quantity 2.
   */
  @ApiProperty({
    example: menuItemExample(new Set<string>(), true),
    description: 'The MenuItem being contained',
    type: MenuItem,
  })
  @ManyToOne(() => MenuItem, {
    eager: true,
    onDelete: 'CASCADE',
  })
  containedMenuItem: MenuItem;

  /**
   * The {@link MenuItemSize} of the {@link containedMenuItem} within the {@link parentOrderMenuItem}.
   *
   * Example: containedItem: Blueberry muffin, containedSize: regular ...
   */
  @ApiProperty({
    example: menuItemSizeExample(new Set<string>(), false),
    description: 'The size of the contained MenuItem',
    type: MenuItemSize,
  })
  @ManyToOne(() => MenuItemSize, {
    eager: true,

    onDelete: 'CASCADE',
  })
  containedItemSize: MenuItemSize;

  @ApiProperty({
    example: '2',
    description: 'The amount of the contained MenuItem being ordered',
  })
  @Column()
  quantity: number;

  /**
   * The parent {@link OrderMenuItem} that represents the ordering of a {@link MenuItem}, where the ordered item is a container of other items.
   *
   * Example: Box of 6 Scones is the {@link parentOrderMenuItem} of the {@link containedMenuItem} { Lemon Glaze, size: regular, quantity: 6 }
   */
  @ApiProperty({
    example: orderMenuItemExample(new Set<string>(), true),
    description: 'The OrderMenuItem that is the container for this item',
    type: () => OrderMenuItem,
  })
  @ManyToOne(() => OrderMenuItem, (parent) => parent.containerOrderMenuItems, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  parentOrderMenuItem: OrderMenuItem;
}
