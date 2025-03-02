import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { UnitOfMeasure } from "./unit-of-measure.entity";

/**
 * The type of metric that a unit represents, such as a measurement "by volume" or "by weight" or "by unit"
 * Required units to exist before declaring baseUnit
 */
@Entity()
export class UnitCategory{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(() => UnitOfMeasure, (unit) => unit.category, { nullable: false })
    units: UnitOfMeasure[];

    /**
     * The type of unit that all units in the category convert to for conversions.
     * - Relevant to UnitOfMeasure.conversionFactorToBase
     */
    @OneToOne(() => UnitOfMeasure, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    baseUnit: UnitOfMeasure | null;
}