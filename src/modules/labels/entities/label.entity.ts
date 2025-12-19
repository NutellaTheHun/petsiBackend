import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { labelTypeExample } from '../../../common/swagger/examples/labels/label-type.example';
import { menuItemExample } from '../../../common/swagger/examples/menu-items/menu-item.example';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { CreateLabelDto } from '../dto/label/create-label.dto';
import { UpdateLabelDto } from '../dto/label/update-label.dto';
import { LabelType } from './label-type.entity';

export type LabelEntity = EntityBase<Label, CreateLabelDto, UpdateLabelDto>;

/**
 * References a {@link menuItem} with a {@link LabelType} and a url to the label image for printing.
 */
@Entity()
@Unique(['menuItem', 'imageUrl', 'labelType'])
export class Label {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Url of image stored in 3rd party source
   */
  @ApiProperty({
    description: 'URL path to the stored image file',
    example: 'http://toMyImages.gov',
  })
  @Column({ type: 'text' })
  imageUrl: string;

  /**
   * MenuItem that this image/type combination is for.
   * Example:
   * - MenuItem: Classic Apple, Type: 4x2, imageUrl: image.com/wsClapple
   * - MenuItem: Classic Apple, Type: 2x1, imageUrl: image.com/cutieClapple
   * - MenuItem: ChickenPotPie, Type: 4x6, imageUrl: image.com/frozenPotPie
   */
  @ApiProperty({
    example: menuItemExample(new Set<string>(), true),
    description: 'The MenuItem this label is for',
    type: MenuItem,
  })
  @ManyToOne(() => MenuItem, { onDelete: 'CASCADE' })
  menuItem: MenuItem;

  /**
   * A {@link LabelType} for categories like: "4x2", "2x1", or "ingredient label"
   */
  @ApiProperty({
    example: labelTypeExample(new Set<string>(), false),
    description: 'The label type describing size characteristics',
    type: LabelType,
  })
  @ManyToOne(() => LabelType, { onDelete: 'SET NULL' })
  labelType: LabelType;
}
