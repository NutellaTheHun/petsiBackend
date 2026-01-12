import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { inventoryAreaCountExample } from '../../../common/swagger/examples/inventory-areas/inventory-area-count.example';
import { inventoryItemSizeExample } from '../../../common/swagger/examples/inventory-items/inventory-item-size.example';
import { inventoryItemExample } from '../../../common/swagger/examples/inventory-items/inventory-item.example';
import { InventoryItemPackage } from '../../inventory-items/entities/inventory-item-package.entity';
import { InventoryItemSize } from '../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { NestedCreateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-create-inventory-area-item.dto copy';
import { NestedUpdateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-update-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
import { InventoryAreaCount } from './inventory-area-count.entity';

export type InventoryAreaItemEntity = EntityBase<
  InventoryAreaItem,
  CreateInventoryAreaItemDto,
  UpdateInventoryAreaItemDto,
  NestedCreateInventoryAreaItemDto,
  NestedUpdateInventoryAreaItemDto
>;
/**
 * A single item within the process of an {@link InventoryAreaCount},
 * representing an {@link InventoryItem}, its quantity, and the {@link InventoryItemSize} of the item (its {@link InventoryItemPackage} and {@link UnitOfMeasure})
 *
 * Is created along as a child to the creation of an Inventory Count, or updated as a child.
 */
@Entity('inventory_area_items')
export class InventoryAreaItem {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The {@link InventoryItem} being counted during the {@link InventoryAreaCount}.
   * - example: 6 pack of 28oz can of evaporated milk(countedItem.name)
   * - example: 10 lb flour(countedItem.name)
   */
  @ApiProperty({
    example: inventoryItemExample(new Set<string>(), true),
    description: 'The inventory item that was recorded',
    type: InventoryItem,
  })
  @ManyToOne(() => InventoryItem, { onDelete: 'CASCADE' })
  countedInventoryItem: InventoryItem;

  /**
   * Represents the amount of units per size.measuredQuantity by size.measureUnit, for instances of multi pack items.
   * - Default value of 1. Shouldn't be 0.
   * - example: 6(unitAmount) pack of 28oz can of evaporated milk
   * - example: 10 lb flour (unit quantity is irrelevant here, technically is value 1)
   */
  @ApiProperty({
    example: 1,
    description:
      'The unit amount of the recorded inventory item / size combination',
  })
  @Column({ type: 'int' })
  amount: number;

  /**
   * The size of the {@link InventoryItem } counted.
   *
   * A size consists of a {@link InventoryItemPackage}, ("box", "bag")
   * and a {@link UnitOfMeasure} ("lbs", "oz", "liters")
   *
   * Creating new InventoryItemSizes is permitted during the creation of {@link InventoryAreaCount} (selects package and unit type on the fly)
   */
  @ApiProperty({
    example: inventoryItemSizeExample(new Set<string>(), true),
    description: 'The size of the inventory item recorded',
    type: InventoryItemSize,
  })
  @ManyToOne(() => InventoryItemSize, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  countedItemSize: InventoryItemSize;

  /**
   * The parent {@link InventoryAreaCount}, the context of which this item is recorded.
   */
  @ApiProperty({
    example: inventoryAreaCountExample(new Set<string>(), true),
    description: 'The inventory count this item was recorded',
    type: () => InventoryAreaCount,
  })
  @ManyToOne(() => InventoryAreaCount, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  parentInventoryCount: InventoryAreaCount;
}
