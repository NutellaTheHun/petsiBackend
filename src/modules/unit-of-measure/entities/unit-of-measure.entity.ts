import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { UnitCategory } from "./unit-category.entity";

/**
 * The size denotion of a given unit quantity across Recipe costing and Inventory Management.
 * 
 * Units of measurement like: "Pounds", "Gallons", "ea"
 * 
 * Governed by {@link UnitCategory } to enforce proper conversions, such as "Weight", "Volume", "Unit".
 */
@Entity()
@Unique(['name', 'abbreviation'])
export class UnitOfMeasure {
    @PrimaryGeneratedColumn()   
    id: number;

    /**
     * "Cup", "Teaspoon", "Fluid ouce"
     */
    @Column({ unique: true, nullable: false })
    name: string;

     /**
     * "Cup": "c", "Teaspoon": "tsp", "Fluid ouce": "fl oz"
     */
    @Column({ unique: true, nullable: false })
    abbreviation: string;

    /**
     * The {@link UnitCategory} of the unit of measurement, such as "Weight", "Volume", "unit"
     * 
     * Units within the same category can convert to each other. (Cant convert from weight to volume. or weight to unit)
     */
    @ManyToOne(() => UnitCategory, (category) => category.units, { nullable: true, onDelete: 'SET NULL', cascade: true })
    category?: UnitCategory | null;

    /**
     * The conversion value to the specified category property's baseUnit.
     * 
     * - Example: UnitCategory: Volume, baseUnit is milliliter
     * - converting Gallon to Liter would be Gallon.conversionFactorToBase -> Liter.conversionFactorToBase
     */
    @Column({ type: "decimal", precision: 18, scale: 10, nullable: true })
    conversionFactorToBase?: string | null;

    getConversionFactor(): number | null {
        return this.conversionFactorToBase ? parseFloat(this.conversionFactorToBase) : null;
    }
}