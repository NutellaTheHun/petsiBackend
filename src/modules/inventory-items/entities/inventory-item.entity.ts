import { BeforeInsert, BeforeRemove, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { InventoryItemSize } from "./inventory-item-size.entity";
import { InventoryItemCategory } from "./inventory-item-category.entity";

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
     * - If the inventory item is deleted, it's removed from the category's reference via BeforeRemove()
     * - If the associated category is deleted, its category will be set to null.
     * - When an item is created, its reference is passed to update category.items via BeforeInsert() hook
     */
    @ManyToOne(() => InventoryItemCategory, (category) => category.items, {   
        nullable: true, 
        cascade: ['update'], 
        onDelete: 'SET NULL' 
    })
    category?: InventoryItemCategory;

    /** When an item is created, its reference is given to it's categories list of items. */
    @BeforeInsert()
    async addToCategory() {
        if (this.category) {
            this.category.items = [...this.category.items, this];
        }
    }

    /**
     * When an item is removed, delete its reference from category.items
     */
    @BeforeRemove()
    async removeFromCategory(){
        if(this.category){
            this.category.items = this.category.items.filter( item => item.id !== this.id);
        }
    }

    /**
     * Pre-existing item sizes, (combination of package type and unit of measurement)
     * - Can be created explicitly through updating InventoryItem, 
     * - can also be created on the fly during the creation of an InventoryAreaItemCount (which is during an InventoryAreaCount creation)
     */
    @OneToMany(() => InventoryItemSize, size => size.item, { nullable: false, cascade: true })
    sizes: InventoryItemSize[] = [];
}