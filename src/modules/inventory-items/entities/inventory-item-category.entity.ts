import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { InventoryItem } from "./inventory-item.entity";

/**
 * Child entity to InventoryItem. Category that an Inventory Item can be: "paper goods", "frozen", "cleaning", "produce"
 * - Is created atomically, (cannot create items and categories at the same time, all items reference pre-existing categories)
 */
@Entity()
export class InventoryItemCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    name: string;

    /**
     * Is empty upon creation. Hold reference to all items under it's category.
     * - is updated through the creation/modification/deletion of InventoryItems
     */
    @OneToMany(() => InventoryItem, (item) => item.category, { nullable: false })
    items: InventoryItem[];
}