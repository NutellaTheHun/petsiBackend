import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
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
     * Unit of measurement like "lbs", "oz", "fl oz", "ea."
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
    @ManyToOne(() => InventoryItem, (item) => item.sizes, { onDelete: 'CASCADE', orphanedRowAction: 'delete'})
    item: InventoryItem;
}