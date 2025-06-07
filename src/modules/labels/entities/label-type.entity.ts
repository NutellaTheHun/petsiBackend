import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Label } from './label.entity';

/**
 * Specifies the size of a {@link Label} with a name.
 * - Example: a 4"x2" label for wholesale, or a 2"x1" cutie label, or a 4"x6" pot pie sticker.
 */
@Entity()
export class LabelType {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: '4x2', description: 'Name of the label type' })
  @Column({ unique: true, nullable: false })
  labelTypeName: string;

  /**
   * In hundreths of an inch.
   * 400(labelLength)x200
   */
  @ApiProperty({
    example: '400',
    description: 'Length of the label in hundreths of an inch',
  })
  @Column({ nullable: false })
  labelTypeLength: number;

  /**
   * In hundreths of an inch.
   * 400x200(labelWidth)
   */
  @ApiProperty({
    example: '200',
    description: 'Width of the label in hundreths of an inch',
  })
  @Column({ nullable: false })
  labelTypeWidth: number;
}
