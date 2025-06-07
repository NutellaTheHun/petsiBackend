import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { InventoryAreaItem } from '../../inventory-areas/entities/inventory-area-item.entity';
import { InventoryItem } from './inventory-item.entity';

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
