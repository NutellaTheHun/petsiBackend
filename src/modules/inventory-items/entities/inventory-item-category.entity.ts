import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Category that an Inventory Item can be: "paper goods", "frozen", "cleaning", "produce"
 */
@Entity()
export class InventoryItemCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    name: string;
}