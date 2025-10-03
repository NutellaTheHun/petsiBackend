import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EntityBase } from '../../../base/entity-base';
import { InventoryAreaItem } from '../../inventory-areas/entities/inventory-area-item.entity';
import { CreateInventoryItemPackageDto } from '../dto/inventory-item-package/create-inventory-item-package.dto';
import { UpdateInventoryItemPackageDto } from '../dto/inventory-item-package/update-inventory-item-package.dto';
import { InventoryItem } from './inventory-item.entity';

export type InventoryItemPackageEntity = EntityBase<
  InventoryItemPackage,
  CreateInventoryItemPackageDto,
  UpdateInventoryItemPackageDto
>;

/**
 * The type of packaging an {@link InventoryItem} is counted in when when mapping to an {@link InventoryAreaItem}
 * - example: "box", "bag", "ea", "can"
 */
@Entity()
export class InventoryItemPackage {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'Box',
    description: 'Name description of a package type',
  })
  @Column({ unique: true, nullable: false })
  packageName: string;
}
