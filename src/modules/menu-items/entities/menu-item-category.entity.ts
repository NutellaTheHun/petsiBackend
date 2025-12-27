import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
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
export class MenuItemCategory {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Pastry', description: 'Name of the category' })
  @Column({ unique: true })
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
  menuItems: MenuItem[] = [];
}
