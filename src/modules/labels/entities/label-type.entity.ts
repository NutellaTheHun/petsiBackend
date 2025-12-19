import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { CreateLabelTypeDto } from '../dto/label-type/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/label-type/update-label-type.dto';
import { Label } from './label.entity';

export type LabelTypeEntity = EntityBase<
  LabelType,
  CreateLabelTypeDto,
  UpdateLabelTypeDto
>;
/**
 * Specifies the size of a {@link Label} with a name.
 * - Example: a 4"x2" label for wholesale, or a 2"x1" cutie label, or a 4"x6" pot pie sticker.
 */
@Entity()
export class LabelType {
  @ApiProperty({
    description: 'The unique identifier of the entity',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Name of the label type', example: '4x2' })
  @Column({ unique: true })
  name: string;

  /**
   * In hundreths of an inch.
   * 400(labelLength)x200
   */
  @ApiProperty({
    description: 'Length of the label in hundreths of an inch',
    example: 400,
  })
  @Column()
  length: number;

  /**
   * In hundreths of an inch.
   * 400x200(labelWidth)
   */
  @ApiProperty({
    description: 'Width of the label in hundreths of an inch',
    example: 200,
  })
  @Column()
  width: number;
}
