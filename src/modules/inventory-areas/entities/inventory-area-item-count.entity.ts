import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { InventoryItem } from "src/modules/inventory-items/entities/inventory-item.entity";
import { InventoryItemSize } from "src/modules/inventory-items/entities/inventory-item-size.entity";
import { InventoryAreaCount } from "./inventory-area-count.entity";

/**
 * A single item within the process of an inventory count,
 * representing an inventory item, its quantity, and the size of the item (its package type and unit of measure ment)
 */
@Entity()
export class InventoryAreaItemCount {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * Reference to the inventory count when this item is counted.
     */
    @ManyToOne(() => InventoryAreaCount, { nullable: false, onDelete: 'CASCADE' })
    areaCount: InventoryAreaCount;

    @ManyToOne(() => InventoryItem, { nullable: false, onDelete: 'CASCADE' })
    inventoryItem: InventoryItem;

    @Column({ nullable: false })
    itemQuantity: number;
    
    /**
     * The size of the item counted. 
     * A size consists of a package type ("box", "bag")
     * and a unity of measurement ("lbs", "oz", "liters")
     */
    @ManyToOne(() => InventoryItemSize, { nullable: false, onDelete: 'CASCADE' })
    itemSize: InventoryItemSize;
}