import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { inventoryAreaCountExample } from '../../../util/swagger-examples/inventory-areas/inventory-area-count.example';
import { InventoryItemSize } from '../../inventory-items/entities/inventory-item-size.entity';
import { InventoryAreaCount } from './inventory-area-count.entity';

/**
 * A declared area that holds inventory. "Walk-in", "Back Room"
 *
 * Is the context of when a inventory count occurs.
 */
@Entity()
export class InventoryArea {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Name of a physical location that stores inventory items.
   * - Such as a "walk-in" or "dry storage".
   */
  @ApiProperty({
    example: 'dry storage',
    description: 'The name of the area',
  })
  @Column({ unique: true, nullable: false })
  areaName: string;

  /**
   * The record of all inventory counts performed for the inventory area.
   *
   * Contains the time it was performed, and a list of {@link InventoryAreaCount} are their {@link InventoryItemSize}
   */
  @ApiProperty({
    example: inventoryAreaCountExample(new Set<string>(), true),
    description: 'A list of inventory counts performed within the area',
    type: () => InventoryAreaCount,
    isArray: true,
  })
  @OneToMany(() => InventoryAreaCount, (areaCount) => areaCount.inventoryArea)
  inventoryCounts: InventoryAreaCount[];
}
