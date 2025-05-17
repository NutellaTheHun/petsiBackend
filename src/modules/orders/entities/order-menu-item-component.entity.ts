import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { OrderMenuItem } from "./order-menu-item.entity";
import { MenuItem } from "../../menu-items/entities/menu-item.entity";
import { MenuItemSize } from "../../menu-items/entities/menu-item-size.entity";

@Entity()
export class OrderMenuItemComponent {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => OrderMenuItem, (parent) => parent.orderedItemComponents, { onDelete: 'CASCADE' })
    parentOrderItem: OrderMenuItem;

    @ManyToOne(() => MenuItem, { eager: true, nullable: false })
    item: MenuItem;

    @ManyToOne(() => MenuItemSize, { eager: true, nullable: false })
    itemSize: MenuItemSize;

    @Column()
    quantity: number;
}