import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { InventoryItemSize } from "../../inventory-items/entities/inventory-item-size.entity";
import { InventoryItem } from "../../inventory-items/entities/inventory-item.entity";
import { InventoryAreaCount } from "./inventory-area-count.entity";
import { InventoryItemPackage } from "../../inventory-items/entities/inventory-item-package.entity";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";

/**
 * A single item within the process of an {@link InventoryAreaCount},
 * representing an {@link InventoryItem}, its quantity, and the {@link InventoryItemSize} of the item (its {@link InventoryItemPackage} and {@link UnitOfMeasure})
 * 
 * Is created along as a child to the creation of an Inventory Count, or updated as a child.
 */
@Entity('inventory_area_items')
export class InventoryAreaItem {
    @PrimaryGeneratedColumn()
    id: number

    /**
     * The parent {@link InventoryAreaCount}, the context of which this item is recorded.
     */
    @ManyToOne(() => InventoryAreaCount, { nullable: false, onDelete: 'CASCADE', orphanedRowAction: 'delete' })
    parentInventoryCount: InventoryAreaCount;

    /**
     * The {@link InventoryItem} being counted during the {@link InventoryAreaCount}.
     * - example: 6 pack of 28oz can of evaporated milk(countedItem.name)
     * - example: 10 lb flour(countedItem.name)
     */
    @ManyToOne(() => InventoryItem, { nullable: false, onDelete: 'CASCADE' })
    countedItem: InventoryItem;

    /**
     * Represents the amount of units per size.measuredQuantity by size.measureUnit, for instances of multi pack items.
     * - Default value of 1. Shouldn't be 0.
     * - example: 6(unitAmount) pack of 28oz can of evaporated milk
     * - example: 10 lb flour (unit quantity is irrelevant here, technically is value 1)
     */
    @Column({ type: 'int', nullable: true })
    amount?: number | null;

    /**
     * The size of the {@link InventoryItem } counted. 
     * 
     * A size consists of a {@link InventoryItemPackage}, ("box", "bag")
     * and a {@link UnitOfMeasure} ("lbs", "oz", "liters")
     * 
     * Creating new InventoryItemSizes is permitted during the creation of {@link InventoryAreaCount} (selects package and unit type on the fly)
     */
    @ManyToOne(() => InventoryItemSize, { nullable: false, cascade: true, onDelete: 'CASCADE' })
    countedItemSize: InventoryItemSize;
}