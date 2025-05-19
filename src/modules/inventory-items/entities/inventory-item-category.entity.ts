import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { InventoryItem } from "./inventory-item.entity";

/**
 * Category to {@link InventoryItem} 
 * - Example: "paper goods", "frozen", "cleaning", "produce"
 */
@Entity()
export class InventoryItemCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    categoryName: string;

    /**
     * Hold reference to all {@link InventoryItem} under it's category.
     * 
     * Is updated through the creation/modification/deletion of InventoryItems
     */
    @OneToMany(() => InventoryItem, (item) => item.category, { nullable: false })
    categoryItems: InventoryItem[];
}