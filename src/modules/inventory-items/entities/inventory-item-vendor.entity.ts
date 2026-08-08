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
import { CreateInventoryItemVendorDto } from '../dto/inventory-item-vendor/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/inventory-item-vendor/update-inventory-item-vendor.dto';
import { InventoryItem } from './inventory-item.entity';

export type InventoryItemVendorEntity = EntityBase<
  InventoryItemVendor,
  CreateInventoryItemVendorDto,
  UpdateInventoryItemVendorDto
>;

/**
 * The vendor that provides an {@link InventoryItem}
 */
@Entity()
@Unique(['tenantId', 'name'])
export class InventoryItemVendor {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The Tenant this vendor belongs to. Denormalized scalar column (not a
   * relation) so ServiceBase-level tenant filtering never needs a join.
   */
  @ApiProperty({
    example: 1,
    description: 'The Tenant this entity belongs to',
  })
  @Column()
  tenantId: number;

  @ApiProperty({ example: 'Dollar Tree', description: 'Name of the vendor' })
  @Column()
  name: string;

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
  inventoryItems: InventoryItem[];
}
