import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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
import { EntityBase } from '../../../base/entity-base';
import { menuItemCategoryExample } from '../../../util/swagger-examples/menu-items/menu-item-category.example';
import { menuItemSizeExample } from '../../../util/swagger-examples/menu-items/menu-item-size.example';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MENU_ITEM_TYPES, MenuItemType } from '../utils/menu-item-type';
import { MenuItemCategory } from './menu-item-category.entity';
import { MenuItemContainerItem } from './menu-item-container-item.entity';
import { MenuItemContainerRule } from './menu-item-container-rule.entity';
import { MenuItemSize } from './menu-item-size.entity';

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

  @Column({
    type: 'enum',
    enum: Object.values(MENU_ITEM_TYPES),
    default: MENU_ITEM_TYPES.SINGLE,
  })
  type: MenuItemType;

  @ApiPropertyOptional({
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
  category?: MenuItemCategory | null;

  @ApiProperty({ example: 'Class Apple Pie', description: 'Name of the item' })
  @Column({ unique: true, nullable: false })
  itemName: string;

  @ApiProperty({
    example: [menuItemSizeExample(new Set<string>(), false)],
    description: 'The sizes the item is available in',
    type: () => MenuItemSize,
    isArray: true,
  })
  @ManyToMany(() => MenuItemSize)
  @JoinTable()
  validSizes: MenuItemSize[];

  @OneToMany(() => MenuItemContainerItem, (ci) => ci.parent, {
    cascade: true,
  })
  fixedContents?: MenuItemContainerItem[];

  @OneToMany(() => MenuItemContainerRule, (rule) => rule.parentMenuItem)
  variableRules?: MenuItemContainerRule[];

  @Column()
  variableMaxAmount?: number;

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
