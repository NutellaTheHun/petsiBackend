import { Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MenuItem } from "./menu-item.entity";
import { OrderMenuItem } from "src/modules/orders/entities/order-menu-item.entity";

@Entity()
export class MenuItemSize{
    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(() => MenuItem, (menuItem) => menuItem.validSizes, { nullable: false })
    @OneToMany(() => OrderMenuItem, (orderItem) => orderItem.size, { nullable: false })
    name: string;
}