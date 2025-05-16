import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";
import { MenuItem } from "../../menu-items/entities/menu-item.entity";
import { MenuItemSize } from "../../menu-items/entities/menu-item-size.entity";

/**
 * A {@link MenuItem} specified with a quantity and {@link MenuItemSize} on an {@link Order}.
 */
@Entity()
export class OrderMenuItem {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The parent order of the item.
     */
    @ManyToOne(() => Order, (order) => order.items, { orphanedRowAction: 'delete', nullable: false, onDelete: 'CASCADE' })
    order: Order;

    /**
     * The item being bought.
     * - Example: "Classic Apple", "Blueberry Muffin", "Large T-shirt", "Box of 6 Scones"
     */
    @ManyToOne(() => MenuItem, { nullable: false, onDelete: 'CASCADE' })
    menuItem: MenuItem;

    /**
     * The amount of the {@link MenuItem} / {@link MenuItemSize} combination being bought.
     */
    @Column({ nullable: false })
    quantity: number;

    /**
     * The {@link MenuItemSize} of the {@link MenuItem} being bought,
     * - Example: "small", "medium", "large", "cold", "hot", "regular"
     */
    @ManyToOne(() => MenuItemSize, { nullable: false })
    size: MenuItemSize;
}