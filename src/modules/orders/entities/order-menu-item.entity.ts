import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MenuItemSize } from "../../menu-items/entities/menu-item-size.entity";
import { MenuItem } from "../../menu-items/entities/menu-item.entity";
import { OrderContainerItem } from "./order-container-item.entity";
import { Order } from "./order.entity";

/**
 * A {@link MenuItem} specified with a quantity and {@link MenuItemSize} on an {@link Order}.
 */
@Entity()
export class OrderMenuItem {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The parent {@link Order} of the item.
     */
    @ManyToOne(() => Order, (order) => order.orderedItems, { orphanedRowAction: 'delete', nullable: false, onDelete: 'CASCADE' })
    order: Order;

    /**
     * The {@link MenuItem} being bought.
     * - Example: "Classic Apple", "Blueberry Muffin", "Large T-shirt", "Box of 6 Scones"
     */
    @ManyToOne(() => MenuItem, { nullable: false, onDelete: 'CASCADE', eager: true })
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
    @ManyToOne(() => MenuItemSize, { nullable: false, eager: true })
    size: MenuItemSize;

    @OneToMany(() => OrderContainerItem, (orderItem) => orderItem.parentOrderItem, { cascade: true, eager: true })
    orderedContainerItems: OrderContainerItem[];
}