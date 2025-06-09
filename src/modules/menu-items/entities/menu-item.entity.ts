import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { menuItemCategoryExample } from '../../../util/swagger-examples/menu-items/menu-item-category.example';
import { menuItemContainerItemExample } from '../../../util/swagger-examples/menu-items/menu-item-container-item.example';
import { menuItemContainerOptionsExample } from '../../../util/swagger-examples/menu-items/menu-item-container-options.example';
import { menuItemSizeExample } from '../../../util/swagger-examples/menu-items/menu-item-size.example';
import { MenuItemCategory } from './menu-item-category.entity';
import { MenuItemContainerItem } from './menu-item-container-item.entity';
import { MenuItemContainerOptions } from './menu-item-container-options.entity';
import { MenuItemSize } from './menu-item-size.entity';

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
   * - Example: "Pie", "Pastry", "Merchandise", "Boxed Pastry", "Catering"
   */
  @ApiProperty({
    example: menuItemCategoryExample(new Set<string>(), true),
    description: 'The category assigned to the item',
    type: () => MenuItemCategory,
  })
  @ManyToOne(() => MenuItemCategory, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  category?: MenuItemCategory | null;

  @ApiProperty({ example: 'Class Apple Pie', description: 'Name of the item' })
  @Column({ unique: true, nullable: false })
  itemName: string;

  /**
   * A different {@link MenuItem} that represents the vegan version of the reference holder.
   * - Example: {@link MenuItem} {Classic Apple Pie}, {@link MenuItem}.veganVersion={Vegan Classic Apple} (A literal other {@link MenuItem} in the catalog)
   * - Example: {@link MenuItem} {Keylime Pie}, {@link MenuItem}.veganOption={null}
   * - Necessary for aggregating the pie and its vegan version together on the BackListPie report (vegan amount denoted with a "V")
   */
  @ApiPropertyOptional({
    example: {},
    description: 'The vegan counterpart to the item.',
    type: () => MenuItem,
  })
  @OneToOne(() => MenuItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  veganOption?: MenuItem | null;

  /**
   * A different {@link MenuItem} that represents the takeNBake (and take'n thaw) version of the reference holder.
   * - Example: {@link MenuItem} {Cherry Pie}, {@link MenuItem}.takeNBakeOption={Take'n Bake Cherry Pie}
   * - Example: {@link MenuItem} {Bananna Cream Pie}, {@link MenuItem}.takeNBakeOption={null}
   */
  @ApiPropertyOptional({
    example: {},
    description: 'The take n bake counterpart to the time',
    type: () => MenuItem,
  })
  @OneToOne(() => MenuItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  takeNBakeOption?: MenuItem | null;

  /**
   * A different {@link MenuItem} that represents the vegan takeNBake (and take'n thaw) version of the reference holder.
   * - Example: {@link MenuItem} {Classic Apple}, {@link MenuItem}.veganTakeNBakeOption={Vegan Apple Take'n Bake}
   * - Example: {@link MenuItem} {Bananna Cream Pie}, {@link MenuItem}.takeNBakeOption={null}
   */
  @ApiPropertyOptional({
    example: {},
    description: 'The vegan take n bake option for the item',
    type: () => MenuItem,
  })
  @OneToOne(() => MenuItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  veganTakeNBakeOption?: MenuItem | null;

  /**
   * The {@link MenuItemSize} that the item is available in.
   *
   * Pies can be sizes Cutie (3"), Small (5"), Medium (8"), and Large (10").
   *
   * Not all pies are necessarily available in all sizes.
   *
   * All items except pies by default are size "regular" (Some merch have sizing, each size is its own item)
   *
   * Some Pastries can be size "mini"
   */
  @ApiProperty({
    example: [menuItemSizeExample(new Set<string>(), false)],
    description: 'The sizes the item is available in',
    type: MenuItemSize,
    isArray: true,
  })
  @ManyToMany(() => MenuItemSize)
  @JoinTable()
  validSizes: MenuItemSize[];

  /**
   * A flag for pies that are pie of the month. POTM has a special row on BackListPie report to be
   * whatever pie that is on order and isPOTM = true.
   *
   * - There is always only one pie of the month. (Supposed to be)
   */
  @ApiProperty({
    example: false,
    description: 'A flag for items that are "Pie of the Month" specials',
  })
  @Column({ default: false })
  isPOTM: boolean;

  /**
   * A flag for pies that require parbakes to be made. Necessary for populating the parbakes row on the BackListPie report.
   */
  @ApiProperty({
    example: true,
    description:
      'A flag for items that require par shells in its baking process',
  })
  @Column({ default: false })
  isParbake: boolean;

  /**
   * If the item is a container of predetermined list for other items.
   *
   * Such as the Breakfast Pastry Platter,
   *
   * Hase a predefined, consistent composition of items per container size.
   *
   * If a {@link MenuItem} references {@link definedContainerItems}, then {@link containerOptions} must be null/undefined
   */
  @ApiPropertyOptional({
    example: [menuItemContainerItemExample(new Set<string>(), false)],
    description:
      'When the item is a container for other MenuItems, and the contained is a fixed set of items per container size.',
    type: () => MenuItemContainerItem,
    isArray: true,
  })
  @OneToMany(() => MenuItemContainerItem, (comp) => comp.parentContainer, {
    cascade: true,
  })
  definedContainerItems?: MenuItemContainerItem[];

  /**
   * If the item is a container where the contents are a variable amount of a selection of items.
   *
   * Such as a Box of 6 Muffins/Scones,
   *
   * The total amount is predetermined/consistent, but the flavors can be any combination of the total amount.
   *
   * Example: A box of 6 muffins could be:
   * - { blueberry: 6, Corn: 0, banana: 0 }
   * - { blueberry: 2, Corn: 2, banana: 2 }
   *
   * If a {@link MenuItem} references {@link containerOptions}, then {@link definedContainerItems} must be null/undefined
   */
  @ApiPropertyOptional({
    example: menuItemContainerOptionsExample(new Set<string>(), false),
    description:
      'When the item is a container for other MenuItems, and the contained items can vary between a set of items and their sizes, totaling a declared size.',
    type: () => MenuItemContainerOptions,
  })
  @OneToOne(
    () => MenuItemContainerOptions,
    (options) => options.parentContainer,
    { cascade: true, nullable: true, onDelete: 'SET NULL' },
  )
  @JoinColumn()
  containerOptions?: MenuItemContainerOptions | null;

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
}
