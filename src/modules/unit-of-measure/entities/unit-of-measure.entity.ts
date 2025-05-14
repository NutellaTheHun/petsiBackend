import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { UnitCategory } from "./unit-category.entity";

@Entity()
@Unique(['name', 'abbreviation'])
export class UnitOfMeasure {
    @PrimaryGeneratedColumn()   
    id: number;

    @Column({ unique: true, nullable: false })
    name: string;

    @Column({ unique: true, nullable: false })
    abbreviation: string;

    @ManyToOne(() => UnitCategory, (category) => category.units, { nullable: true, onDelete: 'SET NULL', cascade: true })
    category?: UnitCategory | null;

    /**
     * Conversion factor to category.baseUnit
     */
    @Column({ type: "decimal", precision: 18, scale: 10, nullable: true })
    conversionFactorToBase?: string | null;

    getConversionFactor(): number | null {
        return this.conversionFactorToBase ? parseFloat(this.conversionFactorToBase) : null;
    }
}