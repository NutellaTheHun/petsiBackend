import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * The type of packaging an item is counted in: "box", "bag", "ea", "can"
 */
@Entity()
export class InventoryItemPackage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    name: string;
} 