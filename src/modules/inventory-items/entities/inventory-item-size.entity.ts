import { ApiProperty } from '@nestjs/swagger';
import {
    Check,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { NestedEntityBase } from '../../../common/base/entity.base';
import { AppUnit } from '../../../common/units';
import { inventoryItemPackageExample } from '../../../common/swagger/examples/inventory-items/inventory-item-package.example';
import { inventoryItemExample } from '../../../common/swagger/examples/inventory-items/inventory-item.example';
import { InventoryAreaItem } from '../../inventory-areas/entities/inventory-area-item.entity';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { NestedCreateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import { InventoryItemPackage } from './inventory-item-package.entity';
import { InventoryItem } from './inventory-item.entity';

export type InventoryItemSizeEntity = NestedEntityBase<
    InventoryItemSize,
    CreateInventoryItemSizeDto,
    UpdateInventoryItemSizeDto,
    NestedCreateInventoryItemSizeDto,
    NestedUpdateInventoryItemSizeDto
>;

/**
 * The possible physical form of an {@link InventoryItem}, an item can have multiple sizes.
 *
 * Maps an {@link InventoryItem} to both an {@link InventoryItemPackage} and a unit symbol, is mapped within {@link InventoryAreaItem}
 *
 * Example:
 * - Flour(InventoryItem), lb(unit), Box(InventoryItemPackage)
 */
@Entity()
export class InventoryItemSize {
    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the entity',
    })
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The parent {@link InventoryItem} that this specific unit of measurement/package type combination refers to.
     *
     * An item can have multiple valid InventoryItemSizes
     */
    @ApiProperty({
        example: inventoryItemExample(new Set<string>(), true),
        description: 'The inventoryitem associated with this InventoryItemSize',
        type: () => InventoryItem,
    })
    @ManyToOne(() => InventoryItem, (item) => item.sizes, {
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })
    inventoryItem: InventoryItem;

    /**
     * Choice of {@link InventoryItemPackage} an inventory item is counted in. "Box", "Can", "Bag"
     */
    @ApiProperty({
        example: inventoryItemPackageExample(new Set<string>(), false),
        description: "The type of package for this item's size.",
        type: InventoryItemPackage,
    })
    @ManyToOne(() => InventoryItemPackage, {
        onDelete: 'CASCADE',
    })
    package: InventoryItemPackage;

    /**
     * Unit symbol like 'lb', 'oz', 'fl-oz', 'ea'.
     * - example: 6 pack of 28(measureAmount) oz(unit) can of evaporated milk
     * - Example: 10(measureAmount) lb(unit) of flour
     */
    @ApiProperty({
        example: 'lb',
        description: 'The unit symbol scaling the measureAmount property',
        type: String,
    })
    @Column()
    unit: AppUnit;

    /**
     * Represents the quantity associated with the unit property.
     * - example: 6 pack of 28(measureAmount)oz can of evaporated milk
     * - Example: 10(measureAmount) lb of flour
     */
    @ApiProperty({
        example: '8',
        description: 'The measure quantity of the unit property',
    })
    @Column()
    measureAmount: number;

    /**
     * The price paid for the item. Used for calculating recipe costs.
     */
    @ApiProperty({
        example: '8.49',
        description: 'The cost for this inventory item / size combination',
        nullable: true,
    })
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    @Check(`"cost" >= 0`)
    cost: string | null;
}
