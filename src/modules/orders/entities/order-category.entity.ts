import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';

/**
 * A category of {@link Order} for filtering/organization such as: "square", "wholesale", "retail", "farmers market", "special", ect.
 */
@Entity()
export class OrderCategory {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'wholesale', description: 'Name of the category.' })
  @Column({ unique: true, nullable: false })
  categoryName: string;

  /**
   * List of {@link Order} falling under the type.
   */
  @ApiProperty({
    example: [{}],
    description: 'Orders under the category',
    type: () => Order,
    isArray: true,
  })
  @OneToMany(() => Order, (order) => order.orderCategory)
  orders: Order[];
}
