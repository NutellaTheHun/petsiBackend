import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MenuItem } from './menu-item.entity';

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
  @Column({ unique: true, nullable: false })
  categoryName: string;

  /**
   * A list of {@link MenuItem} with who's {@link MenuItemCategory} property are set to this instance.
   */
  @ApiProperty({
    example: [{}],
    description: 'MenuItems that are under the category instance',
    type: () => MenuItem,
    isArray: true,
  })
  @OneToMany(() => MenuItem, (item) => item.category)
  categoryItems: MenuItem[];
}
