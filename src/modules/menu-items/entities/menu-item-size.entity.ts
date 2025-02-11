import { Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MenuItem } from "./menu-item.entity";
import { OrderMenuItem } from "src/modules/orders/entities/order-menu-item.entity";

/**
 * - All items except pie are size "regular"
 * - Pies can be size "cutie"(3"), "small"(5"), "medium"(8"), "large"(10")
 */
@Entity()
export class MenuItemSize{
    @PrimaryGeneratedColumn()
    id: number;

    /** 
     * By default, can be "regular", "cutie", "small", "medium", "large" 
     */
    @OneToMany(() => MenuItem, (menuItem) => menuItem.validSizes, { nullable: false })
    @OneToMany(() => OrderMenuItem, (orderItem) => orderItem.size, { nullable: false })
    name: string;
}