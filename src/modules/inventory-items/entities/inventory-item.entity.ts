import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { InventoryItemSize } from "./inventory-item-size.entity";
import { InventoryItemCategory } from "./inventory-item-category.entity";

/**
 * An item that exists in inventory, used for inventory counting, and ingredients for recipes.
 */
@Entity()
export class InventoryItem{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    name: string;

    @ManyToOne(() => InventoryItemCategory, { nullable: false })
    category: InventoryItemCategory;

    @ManyToOne(() => InventoryItemSize, { nullable: false })
    sizes: InventoryItemSize[] = []; // unit of measurement & package type
}