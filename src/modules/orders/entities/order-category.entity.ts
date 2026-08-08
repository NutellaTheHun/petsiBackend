import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { orderExample } from '../../../common/swagger/examples/orders/order.example';
import { CreateOrderCategoryDto } from '../dto/order-category/create-order-category.dto';
import { UpdateOrderCategoryDto } from '../dto/order-category/update-order-category.dto';
import { Order } from './order.entity';

export type OrderCategoryEntity = EntityBase<
  OrderCategory,
  CreateOrderCategoryDto,
  UpdateOrderCategoryDto
>;

/**
 * A category of {@link Order} for filtering/organization such as: "square", "wholesale", "retail", "farmers market", "special", ect.
 */
@Entity()
@Unique(['tenantId', 'name'])
export class OrderCategory {
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

  @ApiProperty({ example: 'wholesale', description: 'Name of the category.' })
  @Column()
  name: string;

  /**
   * List of {@link Order} falling under the type.
   */
  @ApiProperty({
    example: [orderExample(new Set<string>(), true)],
    description: 'Orders under the category',
    type: () => Order,
    isArray: true,
  })
  @OneToMany(() => Order, (order) => order.category)
  orders: Order[];
}
