import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
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
@Unique(['tenantId', 'name'])
export class InventoryItemPackage {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The Tenant this package belongs to. Denormalized scalar column (not a
   * relation) so ServiceBase-level tenant filtering never needs a join.
   */
  @ApiProperty({
    example: 1,
    description: 'The Tenant this entity belongs to',
  })
  @Column()
  tenantId: number;

  @ApiProperty({
    example: 'Box',
    description: 'Name description of a package type',
  })
  @Column()
  name: string;
}
