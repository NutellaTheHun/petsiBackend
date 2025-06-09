import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { inventoryItemExample } from '../../../util/swagger-examples/inventory-items/inventory-item.example';
import { InventoryItem } from './inventory-item.entity';

/**
 * The vendor that provides an {@link InventoryItem}
 */
@Entity()
export class InventoryItemVendor {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Dollar Tree', description: 'Name of the vendor' })
  @Column({ unique: true, nullable: false })
  vendorName: string;

  /**
   * List of all {@link InventoryItem} provided by vendor.
   */
  @ApiProperty({
    example: [inventoryItemExample(new Set<string>(), true)],
    description: 'InventoryItems from the vendor',
    type: () => InventoryItem,
    isArray: true,
  })
  @OneToMany(() => InventoryItem, (item) => item.vendor)
  vendorItems: InventoryItem[];
}
