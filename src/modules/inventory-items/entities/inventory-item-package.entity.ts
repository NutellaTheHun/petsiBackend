import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { InventoryItem } from "./inventory-item.entity";
import { InventoryAreaItem } from "../../inventory-areas/entities/inventory-area-item.entity";

/**
 * The type of packaging an {@link InventoryItem} is counted in when when mapping to an {@link InventoryAreaItem}
 * - example: "box", "bag", "ea", "can"
 */
@Entity()
export class InventoryItemPackage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    name: string;
} 