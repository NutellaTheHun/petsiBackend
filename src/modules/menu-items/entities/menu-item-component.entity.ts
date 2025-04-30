import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { MenuItemSize } from "./menu-item-size.entity";
import { MenuItem } from "./menu-item.entity";

@Entity()
export class MenuItemComponent {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The parent menu item, "Box of 6...", "Pastry Breakfast Platter"
   */
  @ManyToOne(() => MenuItem, (menuItem) => menuItem.components, { onDelete: 'CASCADE' })
  container: MenuItem;

  @ManyToOne(() => MenuItem, { onDelete: 'CASCADE' })
  item: MenuItem;

  @ManyToOne(() => MenuItemSize, { nullable: true })
  size: MenuItemSize | null;

  @Column({ nullable: false })
  quantity: number;
}