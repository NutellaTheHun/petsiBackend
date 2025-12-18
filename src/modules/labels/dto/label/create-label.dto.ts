import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { MenuItem } from '../../../menu-items/menu-items.module';
import { LabelType } from '../../entities/label-type.entity';

export class CreateLabelDto {
  @ApiProperty({
    description: 'URL to image on offsite storage.',
    example: 'label/url.com',
  })
  @IsString()
  @IsNotEmpty()
  readonly imageUrl: string;

  @ApiProperty({
    description: 'Id of MenuItem entity.',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  readonly menuItemId: EntityId<MenuItem>;

  @ApiProperty({
    description: 'Id of LabelType entity.',
    example: 2,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  readonly labelTypeId: EntityId<LabelType>;
}
