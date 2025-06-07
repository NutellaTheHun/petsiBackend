import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinTable,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MenuItemContainerRule } from './menu-item-container-rule.entity';
import { MenuItem } from './menu-item.entity';

/**
 * When a {@link MenuItem} is a dynamic container (meaning the container can contain a custom amount of menuItems)
 * the {@link MenuItemContainerOptions} describes the valid {@link MenuItem} and their {@link MenuItemSize} that are
 * allowed within the container.
 */
@Entity()
export class MenuItemContainerOptions {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The {@link MenuItem} container that the options apply to.
   */
  @ApiProperty({
    example: {},
    description: 'The MenuItem these options apply to.',
    type: () => MenuItem,
  })
  @OneToOne(() => MenuItem, (container) => container.containerOptions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  parentContainer: MenuItem;

  /**
   * A list of {@link MenuItemContainerRule} determining valid items, their sizes, and amounts.
   */
  @ApiProperty({
    example: [{}],
    description:
      'The rules describing what items are allowed in the container and what sizes',
    type: () => MenuItemContainerRule,
    isArray: true,
  })
  @OneToMany(() => MenuItemContainerRule, (c) => c.parentContainerOption, {
    cascade: true,
    eager: true,
  })
  @JoinTable()
  containerRules: MenuItemContainerRule[];

  /**
   * The total amount of items the container holds.
   */
  @ApiProperty({
    example: '6',
    description:
      'The total size of the container that the child items must total.',
  })
  @Column({ nullable: false })
  validQuantity: number;
}
