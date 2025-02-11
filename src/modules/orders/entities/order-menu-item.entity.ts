import { MenuItemSize } from "src/modules/menu-items/entities/menu-item-size.entity";
import { MenuItem } from "src/modules/menu-items/entities/menu-item.entity";
import { Order } from "src/modules/orders/entities/order.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

/**
 * A MenuItem specified with quantity and size on an Order.
 */
@Entity()
export class OrderMenuItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, (order) => order.items, { nullable: false })
    order: Order;

    @ManyToOne(() => MenuItem, (menuItems) => menuItems.onOrder, { nullable: false })
    menuItem: MenuItem;

    @Column({ nullable: false })
    quantity: number;

    @ManyToOne(() => MenuItemSize, { nullable: false })
    size: MenuItemSize;
}
