import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { InventoryItem } from "./inventory-item.entity";

/**
 * The vendor that provides an inventory item
 */
@Entity()
export class InventoryItemVendor {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    name: string;

    @OneToMany(() => InventoryItem, (item) => item.vendor, { nullable: false })
    items: InventoryItem[];
}