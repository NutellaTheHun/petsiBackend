import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { OrderMenuItem } from "./order-menu-item.entity";
import { MenuItem } from "../../menu-items/entities/menu-item.entity";
import { MenuItemSize } from "../../menu-items/entities/menu-item-size.entity";

@Entity()
export class OrderContainerItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => OrderMenuItem, (parent) => parent.orderedItemComponents, { onDelete: 'CASCADE', orphanedRowAction: 'delete' })
    parentOrderItem: OrderMenuItem;

    @ManyToOne(() => MenuItem, { eager: true, nullable: false, onDelete: 'CASCADE' })
    item: MenuItem;

    @ManyToOne(() => MenuItemSize, { eager: true, nullable: false, onDelete: 'CASCADE' })
    itemSize: MenuItemSize;

    @Column()
    quantity: number;
}