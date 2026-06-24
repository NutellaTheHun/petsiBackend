import { ApiProperty } from '@nestjs/swagger';
import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { inventoryItemCategoryExample } from '../../../common/swagger/examples/inventory-items/inventory-item-category.example';
import { inventoryItemSizeExample } from '../../../common/swagger/examples/inventory-items/inventory-item-size.example';
import { inventoryItemVendorExample } from '../../../common/swagger/examples/inventory-items/inventory-item-vendor.example';
import { InventoryAreaCount } from '../../inventory-areas/entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../../inventory-areas/entities/inventory-area-item.entity';
import { RecipeIngredient } from '../../recipes/entities/recipe-ingredient.entity';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import { InventoryItemCategory } from './inventory-item-category.entity';
import { InventoryItemPackage } from './inventory-item-package.entity';
import { InventoryItemSize } from './inventory-item-size.entity';
import { InventoryItemVendor } from './inventory-item-vendor.entity';

export type InventoryItemEntity = EntityBase<
    InventoryItem,
    CreateInventoryItemDto,
    UpdateInventoryItemDto
>;

/**
 * An element of the inventory catalog, referenced via {@link InventoryAreaItem} for inventory counts, and {@link RecipeIngredient} for recipes.
 */
@Entity()
export class InventoryItem {
    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the entity',
    })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: '', description: '' })
    @Column({ unique: true })
    name: string;

    /**
     * {@link InventoryItemCategory} for item.
     *
     * - Example: "Produce", "Dry Goods", "Dairy", "Cleaning Supplies"
     */
    @ApiProperty({
        example: inventoryItemCategoryExample(new Set<string>(), true),
        description: 'The assigned category',
        type: () => InventoryItemCategory,
        nullable: true,
    })
    @ManyToOne(
        () => InventoryItemCategory,
        (category) => category.inventoryItems,
        {
            nullable: true,
            cascade: true,
            onDelete: 'SET NULL',
        },
    )
    category: InventoryItemCategory | null = null;

    /**
     * The supplier of the item.
     * - Example : "Cysco", "Driscols", "Walden Farms"
     */
    @ApiProperty({
        example: inventoryItemVendorExample(new Set<string>(), true),
        description: 'The assigned Vendor',
        type: () => InventoryItemVendor,
        nullable: true,
    })
    @ManyToOne(() => InventoryItemVendor, (vendor) => vendor.inventoryItems, {
        nullable: true,
        cascade: true,
        onDelete: 'SET NULL',
    })
    vendor: InventoryItemVendor | null = null;

    /**
     * The set of sizing the item is recieved, mapping the item to a combination of {@link InventoryItemPackage}, unit symbol and cost
     * - Can be created explicitly through updating InventoryItem,
     * - can also be created on the fly during the creation of an {@link InventoryAreaItem} (which is during an {@link InventoryAreaCount} creation)
     */
    @ApiProperty({
        example: [inventoryItemSizeExample(new Set<string>(), false)],
        description: 'The size options to the item',
        type: () => InventoryItemSize,
        isArray: true,
    })
    @OneToMany(() => InventoryItemSize, (size) => size.inventoryItem, {
        cascade: true,
    })
    sizes: InventoryItemSize[];
}
