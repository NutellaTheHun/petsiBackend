import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { menuItemContainerOptionsExample } from '../../../util/swagger-examples/menu-items/menu-item-container-options.example';
import { menuItemSizeExample } from '../../../util/swagger-examples/menu-items/menu-item-size.example';
import { menuItemExample } from '../../../util/swagger-examples/menu-items/menu-item.example';
import { MenuItemContainerOptions } from './menu-item-container-options.entity';
import { MenuItemSize } from './menu-item-size.entity';
import { MenuItem } from './menu-item.entity';

/**
 * One rule within a {@link MenuItemContainerOptions} that allow one {@link MenuItem} and valid {@link MenuItemSize}
 * within the {@link MenuItemContainerOptions} parent {@link MenuItem}
 */
@Entity()
export class MenuItemContainerRule {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity.',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The {@link MenuItemContainerOptions} that this rule applies to.
   */
  @ApiProperty({
    example: menuItemContainerOptionsExample(new Set<string>(), true),
    description: 'The container options this rule applies to.',
    type: () => MenuItemContainerOptions,
  })
  @ManyToOne(
    () => MenuItemContainerOptions,
    (options) => options.containerRules,
    { onDelete: 'CASCADE', orphanedRowAction: 'delete' },
  )
  parentContainerOption: MenuItemContainerOptions;

  /**
   * The {@link MenuItem} that this rule states is allowed in the parent container.
   */
  @ApiProperty({
    example: menuItemExample(new Set<string>(), true),
    description: 'The MenuItem this rule states is valid in the container.',
    type: () => MenuItem,
  })
  @ManyToOne(() => MenuItem, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: true,
  })
  validItem: MenuItem;

  /**
   * The list of {@link MenuItemSize} of the {@link validItem} that is allowed in the parent container.
   */
  @ApiProperty({
    example: [menuItemSizeExample(new Set<string>(), false)],
    description: 'The sizes of the validItem that is allowed in the container.',
    type: MenuItemSize,
    isArray: true,
  })
  @ManyToMany(() => MenuItemSize, { eager: true })
  @JoinTable()
  validSizes: MenuItemSize[];
}
