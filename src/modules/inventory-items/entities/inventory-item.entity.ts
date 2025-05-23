import { Check, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { InventoryItemCategory } from "./inventory-item-category.entity";
import { InventoryItemSize } from "./inventory-item-size.entity";
import { InventoryItemVendor } from "./inventory-item-vendor.entity";
import { RecipeIngredient } from "../../recipes/entities/recipe-ingredient.entity";
import { InventoryAreaItem } from "../../inventory-areas/entities/inventory-area-item.entity";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";
import { InventoryItemPackage } from "./inventory-item-package.entity";
import { InventoryAreaCount } from "../../inventory-areas/entities/inventory-area-count.entity";

/**
 * An element of the inventory catalog, referenced via {@link InventoryAreaItem} for inventory counts, and {@link RecipeIngredient} for recipes. 
 */
@Entity()
export class InventoryItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    itemName: string;

    /**
     * {@link InventoryItemCategory} for item.
     * 
     * - Example: "Produce", "Dry Goods", "Dairy", "Cleaning Supplies"
     */
    @ManyToOne(() => InventoryItemCategory, (category) => category.categoryItems, {
        nullable: true,
        cascade: true,
        onDelete: 'SET NULL'
    })
    category?: InventoryItemCategory | null;

    /**
     * The supplier of the item.
     * - Example : "Cysco", "Driscols", "Walden Farms"
     */
    @ManyToOne(() => InventoryItemVendor, (vendor) => vendor.vendorItems, {
        nullable: true,
        cascade: true,
        onDelete: 'SET NULL'
    })
    vendor?: InventoryItemVendor | null;

    /**
    * The set of sizing the item is recieved, mapping the item to a combination of {@link InventoryItemPackage}, {@link UnitOfMeasure} and cost
    * - Can be created explicitly through updating InventoryItem, 
    * - can also be created on the fly during the creation of an {@link InventoryAreaItem} (which is during an {@link InventoryAreaCount} creation)
    */
    @OneToMany(() => InventoryItemSize, size => size.inventoryItem, { cascade: true })
    itemSizes: InventoryItemSize[];
}