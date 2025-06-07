import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InventoryItem } from './inventory-item.entity';

/**
 * Category to {@link InventoryItem}
 * - Example: "paper goods", "frozen", "cleaning", "produce"
 */
@Entity()
export class InventoryItemCategory {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Produce', description: 'Name of the category' })
  @Column({ unique: true, nullable: false })
  categoryName: string;

  /**
   * Hold reference to all {@link InventoryItem} under it's category.
   *
   * Is updated through the creation/modification/deletion of {@link InventoryItem}
   */
  @ApiProperty({
    example: 'categoryItemsExample',
    description: 'List of items referencing the category instance',
    type: () => InventoryItem,
    isArray: true,
  })
  @OneToMany(() => InventoryItem, (item) => item.category)
  categoryItems: InventoryItem[];
}
