import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { MenuItemSize } from "./menu-item-size.entity";
import { MenuItem } from "./menu-item.entity";

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
@Entity()
export class MenuItemComponent {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The parent {@link MenuItem}, "Box of 6...", "Pastry Breakfast Platter"
   * 
   * Example:
   * - Box of 6 Muffins(container): { 3 blue, 3 corn}{item}
   */
  @ManyToOne(() => MenuItem, (menuItem) => menuItem.container, { onDelete: 'CASCADE', orphanedRowAction: 'delete' })
  container: MenuItem;

  /**
   * The Parent's {@link MenuItemSize} for the context of this component.
   * 
   * A Box of 6 muffins with size regular, would only have one size.
   * 
   * Breakfast Pastry Platter has size Small, Med, Large, with a separate assortment of {@link menutitem} for each (different quantites)
   */
  @ManyToOne(() => MenuItemSize, { onDelete: 'CASCADE' })
  containerSize: MenuItemSize;

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
  @ManyToOne(() => MenuItem, { onDelete: 'CASCADE' })
  item: MenuItem;

  /**
   * The {@link MenuItemSize} of the represented item,
   * - All pastries are size Regular, sometimes size "mini"
   * - Pies would me "small", "medium", "large"
   */
  @ManyToOne(() => MenuItemSize, { onDelete: 'CASCADE' })
  size: MenuItemSize/* | null*/;

  @Column({ nullable: false })
  quantity: number;
}