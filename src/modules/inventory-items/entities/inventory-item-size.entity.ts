import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { InventoryItemPackage } from "./inventory-item-package.entity";

/**
 * Item size combines the item packaging type and unit of measurement:
 * - lbs, bag
 * - oz, box
 * - fl oz, container
 */
@Entity()
export class InventoryItemSize {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    measureUnit: string; //UnitOfMeasure module

    @Column({ nullable: false })
    packageType: InventoryItemPackage;
}