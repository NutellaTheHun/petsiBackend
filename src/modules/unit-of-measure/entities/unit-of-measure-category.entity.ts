import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityBase } from '../../../base/entity-base';
import { unitOfMeasureExample } from '../../../util/swagger-examples/unit-of-measure/unit-of-measure.example';
import { CreateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/create-unit-of-measure-category.dto';
import { UpdateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/update-unit-of-measure-category.dto';
import { UnitOfMeasure } from './unit-of-measure.entity';

export type UnitOfMeasureCategoryEntity = EntityBase<
  UnitOfMeasureCategory,
  CreateUnitOfMeasureCategoryDto,
  UpdateUnitOfMeasureCategoryDto
>;

/**
 * The type of metric that a {@link UnitOfMeasure} represents, such as a measurement "by volume" or "by weight" or "by unit"
 *
 * Helps validate conversion by preventing a volume being converted to a weight or unit.
 *
 * Declares the base unit per category that all units of measure convert to.
 * - Example:
 * - UnitType.baseUnit = grams,
 * - Converting Pound to Kilogram would be:
 * - Pound -> grams(baseUnit) -> Kilogram
 */
@Entity()
export class UnitOfMeasureCategory {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * "Volume", "Weight", "Unit"
   */
  @ApiProperty({ example: 'Volume', description: 'Name of the category' })
  @Column({ unique: true })
  name: string;

  /**
   * List of {@link UnitOfMeasure} under the category.
   */
  @ApiProperty({
    example: [unitOfMeasureExample(new Set<string>(), true)],
    description: 'List of units of measure under the category',
    type: () => UnitOfMeasure,
    isArray: true,
  })
  @OneToMany(() => UnitOfMeasure, (unit) => unit.category)
  units: UnitOfMeasure[] = [];

  /**
   * The selected {@link UnitOfMeasure} that all units in the category convert to for conversions.
   *
   * the baseUnit reference must be within the parent's category. (Cant see the base category of weight to be a unit of measure from volume)
   */
  @ApiProperty({
    example: unitOfMeasureExample(new Set<string>(), true),
    description:
      'The designated unit all other units under this category use for conversions.',
    type: () => UnitOfMeasure,
    nullable: true,
  })
  @OneToOne(() => UnitOfMeasure, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  baseConversionUnit: UnitOfMeasure | null = null;
}
