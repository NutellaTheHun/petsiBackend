import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * - All items except pie are size "regular"
 * - Pies can be size "cutie"(3"), "small"(5"), "medium"(8"), "large"(10")
 */
@Entity()
export class MenuItemSize {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * By default, can be "regular", "cutie", "small", "medium", "large"
   */
  @ApiProperty({
    example: 'medium',
    description: 'The naming identifier of the size.',
  })
  @Column({ unique: true, nullable: false })
  name: string;
}
