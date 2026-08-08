import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { inventoryAreaItemExample } from '../../../common/swagger/examples/inventory-areas/inventory-area-item.example';
import { inventoryAreaExample } from '../../../common/swagger/examples/inventory-areas/inventory-area.example';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import { InventoryAreaItem } from './inventory-area-item.entity';
import { InventoryArea } from './inventory-area.entity';

export type InventoryAreaCountEntity = EntityBase<
    InventoryAreaCount,
    CreateInventoryAreaCountDto,
    UpdateInventoryAreaCountDto
>;

/**
 * The event of counting {@link InventoryItem} in an {@link InventoryArea}.
 *
 * Associates a list of {@link InventoryAreaItem} at a time counted, with an {@link InventoryArea}.
 */
@Entity()
export class InventoryAreaCount {
    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the entity',
    })
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The Tenant this count belongs to. Denormalized scalar column (not a
     * relation) so ServiceBase-level tenant filtering never needs a join —
     * mirrors {@link InventoryArea.tenantId}, always copied from the
     * referenced InventoryArea, never re-derived independently.
     */
    @ApiProperty({
        example: 1,
        description: 'The Tenant this entity belongs to',
    })
    @Column()
    tenantId: number;

    /**
     * The Location this count belongs to. Denormalized scalar column, same
     * reasoning as tenantId.
     */
    @ApiProperty({
        example: 1,
        description: 'The Location this entity belongs to',
    })
    @Column()
    locationId: number;

    /**
     * The date the {@link InventoryAreaCount} occurs (automatically handled by the database)
     */
    @ApiProperty({
        example: '2025-06-05T23:00:17.814Z',
        description: 'The date the count was taken',
    })
    @CreateDateColumn()
    countDate: Date;

    /**
     * Reference of the {@link InventoryArea} where the inventory count occurs.
     */
    @ApiProperty({
        example: inventoryAreaExample(new Set<string>(), true),
        description: 'The area where the count was taken',
        type: () => InventoryArea,
    })
    @ManyToOne(() => InventoryArea, {
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })
    inventoryArea: InventoryArea;

    /**
     * The record of counted items and their quantites, in the form of {@link InventoryAreaItem}, resulting from the inventory count.
     */
    @ApiProperty({
        example: [inventoryAreaItemExample(new Set<string>(), false)],
        description: 'Inventory items that were recorded during the count.',
        type: () => [InventoryAreaItem],
    })
    @OneToMany(() => InventoryAreaItem, (item) => item.parentInventoryCount, {
        cascade: true,
    })
    @IsArray()
    countedInventoryItems: InventoryAreaItem[];
}
