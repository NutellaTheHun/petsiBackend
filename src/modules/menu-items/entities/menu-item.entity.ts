import { ApiProperty } from '@nestjs/swagger';
import {
    AfterLoad,
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { menuItemCategoryExample } from '../../../common/swagger/examples/menu-items/menu-item-category.example';
import { menuItemSizeExample } from '../../../common/swagger/examples/menu-items/menu-item-size.example';
import {
    deriveFieldRenderType,
    FieldRenderType,
    ValueType,
} from '../../dynamic-properties/entities/dynamic-property-config.entity';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MENU_ITEM_TYPES, MenuItemType } from '../utils/menu-item-type';
import { MenuItemCategory } from './menu-item-category.entity';
import { MenuItemContainerItem } from './menu-item-container-item.entity';
import { MenuItemDynamicPropertyValue } from './menu-item-dynamic-property-value.entity';
import { MenuItemSize } from './menu-item-size.entity';

export interface DynamicPropertyResponseItem {
    configId: number;
    propertyName: string;
    fieldRenderType: FieldRenderType;
    valueType: ValueType;
    valueEntityType: string | null;
    valueEntityCategoryId: number | null;
    value: string | null;
}

export type MenuItemEntity = EntityBase<
    MenuItem,
    CreateMenuItemDto,
    UpdateMenuItemDto
>;

/**
 * An item that is a product to be sold.
 */
@Entity()
export class MenuItem {
    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the entity',
    })
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The date the order is inserted into the database.
     * (Square orders will technically have a different create date that is not used in this property)
     */
    @ApiProperty({
        example: '2025-06-06T19:22:07.102Z',
        description: 'Date the item was created',
    })
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty({
        example: '2025-06-06T19:22:07.102Z',
        description: 'Date the item was last modified',
    })
    @UpdateDateColumn()
    updatedAt: Date;

    @ApiProperty({ example: 'Class Apple Pie', description: 'Name of the item' })
    @Column({ unique: true })
    name: string;

    @Column({
        type: 'enum',
        enum: Object.values(MENU_ITEM_TYPES),
        default: MENU_ITEM_TYPES.SINGLE,
    })
    type: MenuItemType;

    @ApiProperty({
        example: menuItemCategoryExample(new Set<string>(), true),
        description: 'The category assigned to the item',
        type: () => MenuItemCategory,
        nullable: true,
    })
    @ManyToOne(() => MenuItemCategory, {
        nullable: true,
        onDelete: 'SET NULL',
        eager: true,
    })
    category: MenuItemCategory | null = null;

    @ApiProperty({
        example: [menuItemSizeExample(new Set<string>(), false)],
        description: 'The sizes the item is available in',
        type: () => MenuItemSize,
        isArray: true,
        nullable: true,
    })
    @ManyToMany(() => MenuItemSize)
    @JoinTable()
    sizes: MenuItemSize[];

    // API PROPERTY HERE
    @OneToMany(() => MenuItemContainerItem, (ci) => ci.parentMenuItem, {
        cascade: true,
        nullable: true,
    })
    containerMenuItems: MenuItemContainerItem[] | null;

    // API PROPERTY HERE
    /**
     * If menu item is of type container, this property is in play.
     *
     * If variableMaxAmount is null, container is of fixed quantity by parent size.
     *
     * If variableMaxAmount is set, container can be of any combination of its containerItems,
     * with their quantities totalling to the variableMaxAmount.
     *
     * Examples:
     *
     * A Pastry Platter has varaibleMaxAmount is set to null, with sizes small, medium large:
     *
     * A small pastry platter is always: 3 blueberry muffins, 3 triple berry scones, 3 lemon scones
     *
     * A medium pastry platter is always: 4 blueberry muffins, 4 triple berry scones, 4 lemon scones, 4 currant scones
     *
     * ....
     *
     * A Box of 6 Muffins has a variableMaxAmount set to 6:
     *
     * Can be any combination of Blueberry, Corn, and Bannana muffins, but always totaling to 6
     */
    @ApiProperty({
        example: 6,
        description: 'The maximum amount of items that can be in the container',
        nullable: true,
        type: 'number',
    })
    @Column({ type: 'integer', nullable: true })
    variableMaxAmount: number | null = null;

    @OneToMany(() => MenuItemDynamicPropertyValue, (dpv) => dpv.menuItem, { eager: true })
    dynamicPropertyValues: MenuItemDynamicPropertyValue[];

    dynamicProperties: DynamicPropertyResponseItem[] = [];

    @AfterLoad()
    computeDynamicProperties(): void {
        this.dynamicProperties = (this.dynamicPropertyValues ?? [])
            .filter((v) => v.config != null)
            .map((v) => ({
                configId: v.config.id,
                propertyName: v.config.propertyName,
                fieldRenderType: deriveFieldRenderType(v.config.valueType),
                valueType: v.config.valueType,
                valueEntityType: v.config.valueEntityType,
                valueEntityCategoryId: v.config.valueEntityCategory?.id ?? null,
                value:
                    v.config.valueType === ValueType.EntityReference
                        ? (v.valueEntityId?.toString() ?? null)
                        : v.valueText,
            }));
    }
}
