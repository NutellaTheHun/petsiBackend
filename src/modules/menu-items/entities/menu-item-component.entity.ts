import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { MenuItemSize } from "./menu-item-size.entity";
import { MenuItem } from "./menu-item.entity";

@Entity()
export class MenuItemComponent {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The parent menu item, "Box of 6...", "Pastry Breakfast Platter"
   * - the parent Item has a container reference representing the contents of the container
   */
  @ManyToOne(() => MenuItem, (menuItem) => menuItem.container, { onDelete: 'CASCADE' })
  container: MenuItem;

  /**
   * The Parent's size for the context of this component.
   * A Box of 6 muffins with size regular, would only have one variation.
   * Breakfast Pastry Platter has size Small, Med, Large, with a separate assortment of components for each (different quantites)
   */
  @ManyToOne(() => MenuItemSize, { nullable: true })
  containerSize: MenuItemSize | null;

  /**
   * The item the component represents.
   * - For Example:
   * - A component of a box of 6 muffins can be "Blueberry Muffin", or "Banana Chocolate Chip Muffin" menuItems
   * - Breakfast Pastry Platter could be a Scone MenuItem, or any Muffin MenuItem
   */
  @ManyToOne(() => MenuItem, { onDelete: 'CASCADE' })
  item: MenuItem;

  /**
   * The size of the represented item,
   * - All pastries are size Regular, sometimes size "mini"
   */
  @ManyToOne(() => MenuItemSize, { nullable: true })
  size: MenuItemSize | null;

  @Column({ nullable: false })
  quantity: number;
}