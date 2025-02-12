import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UnitCategory } from "./unit-category.entity";

@Entity()
export class UnitOfMeasure {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    name: string;

    @Column({ nullable: false })
    abbreviation: string;

    @ManyToOne(() => UnitCategory)
    category: UnitCategory;

    /**
     * Conversion factor to category.baseUnit
     */
    @Column({ nullable: true })
    conversionFactorToBase?: number; 
}