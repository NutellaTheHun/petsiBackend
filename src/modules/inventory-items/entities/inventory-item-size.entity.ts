import { ApiProperty } from '@nestjs/swagger';
import {
  Check,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InventoryAreaItem } from '../../inventory-areas/entities/inventory-area-item.entity';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { InventoryItemPackage } from './inventory-item-package.entity';
import { InventoryItem } from './inventory-item.entity';

/**
 * The possible physical form of an {@link InventoryItem}, an item can have multiple sizes.
 *
 * Maps an {@link InventoryItem} to both an {@link InventoryItemPackage} and a {@link UnitOfMeasure}, is mapped within {@link InventoryAreaItem}
 *
 * Example:
 * - Flour(InventoryItem), Pounds(UnitOfMeasure), Box(InventoryItemPackage)
 */
@Entity()
export class InventoryItemSize {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Represents the quantity associated with the measureUnit property.
   * - example: 6 pack of 28(measureAmount)oz can of evaporated milk
   * - Example: 10(measureAmount) lb of flour
   */
  @ApiProperty({
    example: '8',
    description: 'The measure quantity of the measureUnit property',
  })
  @Column({ nullable: false })
  measureAmount: number;

  /**
   * {@link UnitOfMeasure} like "lbs", "oz", "fl oz", "ea."
   * - example: 6 pack of 28oz(measureUnit) can of evaporated milk
   * - Example: 10 lb(measureUnit) of flour
   */
  @ApiProperty({
    example: '',
    description: 'The unit of measure scaling the measureAmount property',
    type: UnitOfMeasure,
  })
  @ManyToOne(() => UnitOfMeasure, { onDelete: 'CASCADE', nullable: false })
  measureUnit: UnitOfMeasure;

  /**
   * Choice of {@link InventoryItemPackage} an inventory item is counted in. "Box", "Can", "Bag"
   */
  @ApiProperty({
    example: 'example.packageTypeExample',
    description: "The type of package for this item's size.",
    type: InventoryItemPackage,
  })
  @ManyToOne(() => InventoryItemPackage, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  packageType: InventoryItemPackage;

  /**
   * The parent {@link InventoryItem} that this specific unit of measurement/package type combination refers to.
   *
   * An item can have multiple valid InventoryItemSizes
   */
  @ApiProperty({
    example: 'example.inventoryItemExample',
    description: 'The inventoryitem associated with this InventoryItemSize',
    type: () => InventoryItem,
  })
  @ManyToOne(() => InventoryItem, (item) => item.itemSizes, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  inventoryItem: InventoryItem;

  /**
   * The price paid for the item. Used for calculating recipe costs.
   */
  @ApiProperty({
    example: '8.49',
    description: 'The cost for this inventory item / size combination',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  @Check(`"cost" >= 0`)
  cost: string;
}
