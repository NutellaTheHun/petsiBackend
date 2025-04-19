import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { InventoryItemPackage } from "./inventory-item-package.entity";
import { InventoryItem } from "./inventory-item.entity";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";

/**
 * A child entity to Inventory Item. Can be created through modifying an InventoryItem, or during an InventoryCount.
 * Item size combines the item packaging type and unit of measurement:
 * - lbs, bag
 * - oz, box
 * - fl oz, container
 */
@Entity()
export class InventoryItemSize {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * Unit of measurement like "lbs", "oz", "fl oz", "ea."
     * - Not a database entity. From UnitOfMeasureModule
     * - Selected from pre-existing options.
     */
    @ManyToOne(() => UnitOfMeasure)
    measureUnit: UnitOfMeasure;

    /**
     * Type of package an inventory item is counted in. "Box", "Can", "Bag"
     * - Selected from pre-existing package types. (Not created during an inventory count when inventoryItemSize is created)
     * - If a package type is deleted, all ItemSizes referencing it will be removed.
     */
    @ManyToOne(() => InventoryItemPackage, { onDelete: 'CASCADE' })
    packageType: InventoryItemPackage;

    /**
     * The item that this specific unit of measurement/package type combination refers to.
     * - An item can have multiple valid InventoryItemSizes
     * - If an item is deleted, all of its associated item sizes will be removed.
     * - An Item's size is updated through the InventoryItem object. (cascade is true for InventoryItem.sizes[])
     */
    @ManyToOne(() => InventoryItem, (item) => item.sizes, { /*nullable: false,*/ onDelete: 'CASCADE', orphanedRowAction: 'delete'})
    item: InventoryItem;
}