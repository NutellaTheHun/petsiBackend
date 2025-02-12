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

    // figure out a good way of enforcing the base unit
    @Column({ nullable: true })
    conversionFactorToBase?: number; 
}