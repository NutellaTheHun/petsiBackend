import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { InventoryItem } from "./inventory-item.entity";

/**
 * The vendor that provides an inventory item
 */
@Entity()
export class InventoryItemVendor {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    name: string;

    @OneToMany(() => InventoryItem, (item) => item.category, { nullable: false })
    items : InventoryItem[];
} 