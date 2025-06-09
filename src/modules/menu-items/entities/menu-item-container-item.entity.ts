import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { menuItemSizeExample } from '../../../util/swagger-examples/menu-items/menu-item-size.example';
import { menuItemExample } from '../../../util/swagger-examples/menu-items/menu-item.example';
import { MenuItemSize } from './menu-item-size.entity';
import { MenuItem } from './menu-item.entity';

/**
 * When a {@link MenuItem} is a product composed of a set of other {@link MenuItem}
 *
 * Such as a Box of 6 scones, or a Breakfast Pastry Platter
 *
 * A Breakfast Pastry Platter is a defined set of items, with multiple sizes that varies the quantites of inner items.
 *
 * A Box of 6 scones has a defined set of valid MenuItems that can vary in choice, but total to the boxed quantity.
 *
 * For Example, a Box of 6 scones consists of any amount of Lemon Glaze, Triple Berry, or Currant scones totaling to 6.
 * - Can be { lemon: 6, trip: 0, currant: 0 }
 * - Can be { lemon: 2, trip: 2, currant: 2 }
 */
@Unique([
  'parentContainer',
  'parentContainerSize',
  'containedItem',
  'containedItemsize',
])
@Entity()
export class MenuItemContainerItem {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The parent {@link MenuItem}, "Box of 6...", "Pastry Breakfast Platter"
   *
   * Example:
   * - Box of 6 Muffins(container): { 3 blue, 3 corn}{item}
   */
  @ApiProperty({
    example: menuItemExample(new Set<string>(), true),
    description: 'The MenuItem that is the container to this item',
    type: () => MenuItem,
  })
  @ManyToOne(() => MenuItem, (menuItem) => menuItem.definedContainerItems, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  parentContainer: MenuItem;

  /**
   * The Parent's {@link MenuItemSize} for the context of this component.
   *
   * A Box of 6 muffins with size regular, would only have one size.
   *
   * Breakfast Pastry Platter has size Small, Med, Large, with a separate assortment of {@link menutitem} for each (different quantites)
   */
  @ApiProperty({
    example: menuItemSizeExample(new Set<string>(), true),
    description: 'The size of the container to this item',
    type: MenuItemSize,
  })
  @ManyToOne(() => MenuItemSize, { onDelete: 'CASCADE', nullable: false })
  parentContainerSize: MenuItemSize;

  /**
   * The {@link MenuItem} the component represents.
   * - For Example:
   * - Box of 6 scones:
   *
   *          .menuItemComponent[] { lemon(MenuItem): 6,
   *                                 trip(MenuItem): 0,
   *                                 currant(MenuItem): 0 }
   *
   * - Breakfast Pastry Platter could be a Scone MenuItem, or any Muffin MenuItem
   */
  @ApiProperty({
    example: menuItemExample(new Set<string>(), true),
    description: 'The menuItem that is being referenced as the contained item',
    type: () => MenuItem,
  })
  @ManyToOne(() => MenuItem, { onDelete: 'CASCADE', nullable: false })
  containedItem: MenuItem;

  /**
   * The {@link MenuItemSize} of the represented item,
   * - All pastries are size Regular, sometimes size "mini"
   * - Pies would me "small", "medium", "large"
   */
  @ApiProperty({
    example: menuItemSizeExample(new Set<string>(), false),
    description: 'The size of the MenuItem that is being contained',
    type: MenuItemSize,
  })
  @ManyToOne(() => MenuItemSize, { onDelete: 'CASCADE', nullable: false })
  containedItemsize: MenuItemSize;

  @ApiProperty({
    example: {},
    description: 'The amount of the contained MenuItem.',
  })
  @Column({ nullable: false })
  quantity: number;
}
