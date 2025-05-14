import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { InventoryItemSize } from "../../inventory-items/entities/inventory-item-size.entity";
import { InventoryItem } from "../../inventory-items/entities/inventory-item.entity";
import { InventoryAreaCount } from "./inventory-area-count.entity";

/**
 * A single item within the process of an inventory count,
 * representing an inventory item, its quantity, and the size of the item (its package type and unit of measure ment)
 * - Is created along with the creation of an Inventory Count, (Saving Inventory Count automatically saves this entity)
 */
@Entity('inventory_area_items')
export class InventoryAreaItem {
    @PrimaryGeneratedColumn()
    id: number

    /**
     * Reference to the inventory count when this item is counted.
     * - If the referenced inventory count is deleted, its associated counted items will be deleted 
     */
    @ManyToOne(() => InventoryAreaCount, { nullable: false, onDelete: 'CASCADE', orphanedRowAction: 'delete' })
    areaCount: InventoryAreaCount;

    /**
     * The item from the inventory catalog being referenced.
     * - If the inventory item is deleted from the catalog, it's references in all inventory counts will be removed.
     * - Must reference a pre-existing inventory item. (No creation while performing an inventory count)
     */
    // 1-1
    @ManyToOne(() => InventoryItem, { nullable: false, onDelete: 'CASCADE' })
    item: InventoryItem;

    /**
     * Represents the amount of units per measuredQuantity and size, for instances of multi pack items.
     * - Default value of 1. Shouldn't be 0.
     * - example: 6 pack of 28oz can of evaporated milk (the 6 is the unit quantity)
     * - example: 10 lb flour (unit quantity is irrelevant here, technically is value 1)
     * - NOT FINAL: Most likely controlled by a isMultiPack bool on the buisness logic side?
     */
    @Column({ type: 'int', nullable: true })
    unitAmount?: number | null;

    /**
     * Represents the quantity associated with the unit of measure
     * - Example: 10 lb of flour (10 is the quanity of the measure type)
     */
    @Column({ nullable: false })
    measureAmount: number;
    
    /**
     * The size of the item counted. 
     * A size consists of a package type ("box", "bag")
     * and a unit of measurement ("lbs", "oz", "liters")
     * - Creating new InventoryItemSizes is permitted during an inventory count (selects package and unit type on the fly)
     * - If an inventory item size is deleted, all referencing items will also be removed. 
     * (inventory item sizes are a set of sizes per item, meaning only all counts referencing that item/itemsize combination will be removed)
     */
    //1-1
    @ManyToOne(() => InventoryItemSize, { nullable: false, cascade: true, onDelete: 'CASCADE' })
    size: InventoryItemSize;
}