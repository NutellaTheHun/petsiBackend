import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { inventoryAreaCountExample } from '../../../common/swagger/examples/inventory-areas/inventory-area-count.example';
import { InventoryItemSize } from '../../inventory-items/entities/inventory-item-size.entity';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { UpdateInventoryAreaDto } from '../dto/inventory-area/update-inventory-area.dto';
import { InventoryAreaCount } from './inventory-area-count.entity';

export type InventoryAreaEntity = EntityBase<
    InventoryArea,
    CreateInventoryAreaDto,
    UpdateInventoryAreaDto
>;
/**
 * A declared area that holds inventory. "Walk-in", "Back Room"
 *
 * Is the context of when a inventory count occurs.
 */
@Entity()
@Unique(['tenantId', 'locationId', 'name'])
export class InventoryArea {
    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the entity',
    })
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The Tenant this area belongs to. Denormalized scalar column (not a
     * relation) so ServiceBase-level tenant filtering never needs a join.
     */
    @ApiProperty({
        example: 1,
        description: 'The Tenant this entity belongs to',
    })
    @Column()
    tenantId: number;

    /**
     * The Location this area belongs to. Denormalized scalar column, same
     * reasoning as tenantId.
     */
    @ApiProperty({
        example: 1,
        description: 'The Location this entity belongs to',
    })
    @Column()
    locationId: number;

    /**
     * Name of a physical location that stores inventory items.
     * - Such as a "walk-in" or "dry storage".
     */
    @ApiProperty({
        example: 'dry storage',
        description: 'The name of the area',
    })
    @Column()
    name: string;

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
