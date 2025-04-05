import { CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { InventoryArea } from "./inventory-area.entity";
import { InventoryAreaItem } from "./inventory-area-item.entity";

/**
 * The event of counting the items in an inventory area.
 * Associates a list of goods and their quantities at the time counted, with the inventory area.
 * 
 * USAGE:
 * - When an item count is performed, an empty InventoryAreaCount is created, 
 * - the items that are counted are sent as an update to the entity.
 * - NOTE: See InventoryAreaCountBuilder.buildCreateDto() and .buildUpdateDto()
 * 
 * Creational Requirements:
 * - inventoryArea reference
 * 
 * Creational Restrictions:
 * - inventoryAreaItem references
 */
@Entity()
export class InventoryAreaCount{
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The physical are the inventory count occurs.
     * - When an inventory area is deleted, its associated inventory counts will also be deleted
     */
    @ManyToOne(() => InventoryArea, { nullable: false, onDelete: 'CASCADE' })
    inventoryArea: InventoryArea;

    /**
     * The date the inventory count occurs (automatically handled by the database)
     */
    @CreateDateColumn()
    countDate: Date;

    /**
     * The record of items and their quantites resulting from the inventory count.
     * - An inventory count is created separate and before when the inventoryItems are created.
     * - countedItems will be populated when an Inventory Count is updated.
     * - handled with cascade: true
     */
    @OneToMany(() => InventoryAreaItem, (item) => item.areaCount, { cascade: true, nullable: true})
    items?: InventoryAreaItem[] | null;
}