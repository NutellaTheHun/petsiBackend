import { CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { InventoryArea } from "./inventory-area.entity";
import { InventoryAreaItem } from "./inventory-area-item.entity";
import { InventoryItem } from "../../inventory-items/entities/inventory-item.entity";


/**
 * The event of counting {@link InventoryItem} in an {@link InventoryArea}.
 * 
 * Associates a list of {@link InventoryAreaItem} at a time counted, with an {@link InventoryArea}.
 */
@Entity()
export class InventoryAreaCount{
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The physical area the inventory count occurs.
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
     */
    @OneToMany(() => InventoryAreaItem, (item) => item.parentInventoryCount, { cascade: true, nullable: true})
    countedItems?: InventoryAreaItem[] | null;
}