import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { inventoryItemExample } from '../../../common/swagger/examples/inventory-items/inventory-item.example';
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/update-inventory-item-category.dto';
import { InventoryItem } from './inventory-item.entity';

export type InventoryItemCategoryEntity = EntityBase<
  InventoryItemCategory,
  CreateInventoryItemCategoryDto,
  UpdateInventoryItemCategoryDto
>;

/**
 * Category to {@link InventoryItem}
 * - Example: "paper goods", "frozen", "cleaning", "produce"
 */
@Entity()
@Unique(['tenantId', 'name'])
export class InventoryItemCategory {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The Tenant this category belongs to. Denormalized scalar column (not a
   * relation) so ServiceBase-level tenant filtering never needs a join.
   */
  @ApiProperty({
    example: 1,
    description: 'The Tenant this entity belongs to',
  })
  @Column()
  tenantId: number;

  @ApiProperty({ example: 'Produce', description: 'Name of the category' })
  @Column()
  name: string;

  /**
   * Hold reference to all {@link InventoryItem} under it's category.
   *
   * Is updated through the creation/modification/deletion of {@link InventoryItem}
   */
  @ApiProperty({
    example: [inventoryItemExample(new Set<string>(), true)],
    description: 'List of items referencing the category instance',
    type: () => InventoryItem,
    isArray: true,
  })
  @OneToMany(() => InventoryItem, (item) => item.category)
  inventoryItems: InventoryItem[];
}
