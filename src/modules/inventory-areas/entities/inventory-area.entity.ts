import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { InventoryAreaCount } from "./inventory-area-count.entity";

/**
 * A declared area that holds inventory. "Walk-in", "Back Room"
 * Is the context of when a inventory count occurs.
 * @class
 */
@Entity()
export class InventoryArea{
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * Name of a physical location that stores inventory items.
     * Such as a walk-in or a dry storage area.
     */
    @Column({ nullable: false })
    name: string;

    /**
    * The record of all inventory counts performed for the inventory area.
    * Contains the time it was performed, and a list of items counted
    */
    @OneToMany(() => InventoryAreaCount, (areaCount) => areaCount.inventoryArea, { cascade: true, nullable: false })
    inventoryCounts: InventoryAreaCount[] = [];
}