import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { InventoryItemCategory } from "./inventory-item-category.entity";
import { InventoryItemSize } from "./inventory-item-size.entity";
import { InventoryItemVendor } from "./inventory-item-vendor.entity";

/**
 * An item that exists in inventory, referenced for inventory counting, and ingredients for recipes. 
 */
@Entity()
export class InventoryItem{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    name: string;

    /**
     * - categories must be pre-existing, or null  (cannot create a new category when making a new item)
     * - If the associated category is deleted, the item's category will be set to null.

     */
    @ManyToOne(() => InventoryItemCategory, (category) => category.items, {   
        nullable: true, 
        cascade: true,
        onDelete: 'SET NULL' 
    })
    category?: InventoryItemCategory | null

    /**
     * Pre-existing item sizes, (combination of package type and unit of measurement)
     * - Can be created explicitly through updating InventoryItem, 
     * - can also be created on the fly during the creation of an InventoryAreaItemCount (which is during an InventoryAreaCount creation)
     */
    @OneToMany(() => InventoryItemSize, size => size.item, { nullable: true, cascade: true })
    sizes: InventoryItemSize[] | null;

    /**
     * - If the associated vendor is deleted, the item's vendor will be set to null?(maybe not).
     */
    @ManyToOne(() => InventoryItemVendor, (vendor) => vendor.items, {       
        nullable: true, 
        cascade: true, 
        onDelete: 'SET NULL'  
    })
    vendor?: InventoryItemVendor | null;
}