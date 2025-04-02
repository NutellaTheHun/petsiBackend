import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";
import { MenuItem } from "../../menu-items/entities/menu-item.entity";
import { MenuItemSize } from "../../menu-items/entities/menu-item-size.entity";

/**
 * A MenuItem specified with quantity and size on an Order.
 */
@Entity()
export class OrderMenuItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, (order) => order.items, { nullable: false })
    order: Order;

    @ManyToOne(() => MenuItem, (menuItem) => menuItem.onOrder, { nullable: false })
    menuItem: MenuItem;

    @Column({ nullable: false })
    quantity: number;

    @ManyToOne(() => MenuItemSize, { nullable: false })
    size: MenuItemSize;
}
