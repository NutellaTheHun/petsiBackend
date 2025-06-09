import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { unitOfMeasureCategoryExample } from '../../../util/swagger-examples/unit-of-measure/unit-of-measure-category.example';
import { UnitOfMeasureCategory } from './unit-of-measure-category.entity';

/**
 * The size denotion of a given unit quantity across Recipe costing and Inventory Management.
 *
 * Units of measurement like: "Pounds", "Gallons", "ea"
 *
 * Governed by {@link UnitOfMeasureCategory } to enforce proper conversions, such as "Weight", "Volume", "Unit".
 */
@Entity()
@Unique(['name', 'abbreviation'])
export class UnitOfMeasure {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * "Cup", "Teaspoon", "Fluid ouce"
   */
  @ApiProperty({ example: '', description: '' })
  @Column({ unique: true, nullable: false })
  name: string;

  /**
   * "Cup": "c", "Teaspoon": "tsp", "Fluid ouce": "fl oz"
   */
  @ApiProperty({ example: '', description: '' })
  @Column({ unique: true, nullable: false })
  abbreviation: string;

  /**
   * The {@link UnitOfMeasureCategory} of the unit of measurement, such as "Weight", "Volume", "unit"
   *
   * Units within the same category can convert to each other. (Cant convert from weight to volume. or weight to unit)
   */
  @ApiPropertyOptional({
    example: unitOfMeasureCategoryExample(new Set<string>(), true),
    description: '',
    type: () => UnitOfMeasureCategory,
  })
  @ManyToOne(
    () => UnitOfMeasureCategory,
    (category) => category.unitsOfMeasure,
    { nullable: true, onDelete: 'SET NULL', cascade: true },
  )
  category?: UnitOfMeasureCategory | null;

  /**
   * The conversion value to the specified category property's baseUnit.
   *
   * - Example: UnitCategory: Volume, baseUnit is milliliter
   * - converting Gallon to Liter would be Gallon.conversionFactorToBase -> Liter.conversionFactorToBase
   */
  @ApiPropertyOptional({ example: '', description: '' })
  @Column({ type: 'decimal', precision: 18, scale: 10 })
  conversionFactorToBase?: string;

  getConversionFactor(): number | null {
    return this.conversionFactorToBase
      ? parseFloat(this.conversionFactorToBase)
      : null;
  }
}
