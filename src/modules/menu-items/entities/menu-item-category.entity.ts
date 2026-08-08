import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { menuItemExample } from '../../../common/swagger/examples/menu-items/menu-item.example';
import { CreateMenuItemCategoryDto } from '../dto/menu-item-category/create-menu-item-category.dto';
import { UpdateMenuItemCategoryDto } from '../dto/menu-item-category/update-menu-item-category.dto';
import { MenuItem } from './menu-item.entity';

export type MenuItemCategoryEntity = EntityBase<
  MenuItemCategory,
  CreateMenuItemCategoryDto,
  UpdateMenuItemCategoryDto
>;

/**
 * Product categories such as "Pie", "Pastry", "Merchandise", "Boxed Pastry"
 */
@Entity()
@Unique(['tenantId', 'name'])
export class MenuItemCategory {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The Tenant this category belongs to. Denormalized scalar column (not a
   * relation) so ServiceBase-level tenant filtering never needs a join.
   */
  @ApiProperty({
    example: 1,
    description: 'The Tenant this entity belongs to',
  })
  @Column()
  tenantId: number;

  @ApiProperty({ example: 'Pastry', description: 'Name of the category' })
  @Column()
  name: string;

  /**
   * A list of {@link MenuItem} with who's {@link MenuItemCategory} property are set to this instance.
   */
  @ApiProperty({
    example: [menuItemExample(new Set<string>(), true)],
    description: 'MenuItems that are under the category instance',
    type: () => MenuItem,
    isArray: true,
  })
  @OneToMany(() => MenuItem, (item) => item.category)
  menuItems: MenuItem[];
}
