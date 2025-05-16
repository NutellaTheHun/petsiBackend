import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { InventoryAreaCount } from "./inventory-area-count.entity";
import { InventoryItemSize } from "../../inventory-items/entities/inventory-item-size.entity";

/**
 * A declared area that holds inventory. "Walk-in", "Back Room"
 * 
 * Is the context of when a inventory count occurs.
 */
@Entity()
export class InventoryArea {

    @PrimaryGeneratedColumn()
    id: number;

    /**
     * Name of a physical location that stores inventory items.
     * - Such as a "walk-in" or "dry storage".
     */
    @Column({ unique: true, nullable: false })
    name: string;

    /**
    * The record of all inventory counts performed for the inventory area.
    * 
    * Contains the time it was performed, and a list of {@link InventoryAreaCount} are their {@link InventoryItemSize}
    */
    @OneToMany(() => InventoryAreaCount, (areaCount) => areaCount.inventoryArea, { nullable: true })
    inventoryCounts?: InventoryAreaCount[] | null;
}