import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { InventoryItem } from "./inventory-item.entity";

/**
 * The vendor that provides an {@link InventoryItem}
 */
@Entity()
export class InventoryItemVendor {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    name: string;

    /**
     * List of all {@link InventoryItem} provided by vendor.
     */
    @OneToMany(() => InventoryItem, (item) => item.vendor, { nullable: false })
    items: InventoryItem[];
}