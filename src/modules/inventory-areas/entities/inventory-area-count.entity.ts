import { CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { InventoryArea } from "./inventory-area.entity";
import { InventoryAreaItemCount } from "./inventory-area-item-count.entity";

/**
 * The event of counting the items in an inventory area.
 * Associates a list of goods and their quantities at the time counted, with the inventory area.
 */
@Entity()
export class InventoryAreaCount{
    @PrimaryColumn()
    id: number;

    /**
     * The physical are the inventory count occurs.
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
     * Cannot be null, always initialized to empty array
     */
    @OneToMany(() => InventoryAreaItemCount, (item) => item.areaCount, { cascade: true, nullable: false})
    countedItems: InventoryAreaItemCount[] = [];
}