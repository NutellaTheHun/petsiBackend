import { Check, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { InventoryItemPackage } from "./inventory-item-package.entity";
import { InventoryItem } from "./inventory-item.entity";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";
import { InventoryAreaItem } from "../../inventory-areas/entities/inventory-area-item.entity";

/**
* The possible physical form of an {@link InventoryItem}, an item can have multiple sizes.
* 
* Maps an {@link InventoryItem} to both an {@link InventoryItemPackage} and a {@link UnitOfMeasure}, is mapped within {@link InventoryAreaItem}
* 
* Example: 
* - Flour(InventoryItem), Pounds(UnitOfMeasure), Box(InventoryItemPackage)
*/
@Entity()
export class InventoryItemSize {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * Represents the quantity associated with the measureUnit property.
     * - example: 6 pack of 28(measureAmount)oz can of evaporated milk
     * - Example: 10(measureAmount) lb of flour
     */
    @Column({ nullable: false })
    measureAmount: number;

    /**
     * Unit of measurement like "lbs", "oz", "fl oz", "ea."
     * - example: 6 pack of 28oz(measureUnit) can of evaporated milk
     * - Example: 10 lb(measureUnit) of flour
     */
    @ManyToOne(() => UnitOfMeasure, { onDelete: 'CASCADE' })
    measureUnit: UnitOfMeasure;

    /**
     * Type of package an inventory item is counted in. "Box", "Can", "Bag"
     */
    @ManyToOne(() => InventoryItemPackage, { onDelete: 'CASCADE' })
    packageType: InventoryItemPackage;

    /**
     * The parent item that this specific unit of measurement/package type combination refers to.
     * 
     * An item can have multiple valid InventoryItemSizes
     */
    @ManyToOne(() => InventoryItem, (item) => item.itemSizes, { onDelete: 'CASCADE', orphanedRowAction: 'delete'})
    inventoryItem: InventoryItem;

    /**
     * The price paid for the item. Used for calculating recipe costs.
     */
    @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
    @Check(`"cost" >= 0`)
    cost: string;
}