import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { UpdateTemplateMenuItemDto } from './update-template-menu-item.dto';

export class NestedUpdateTemplateMenuItemDto {
  @ApiProperty({
    description: 'Id of the TemplateMenuItem entity.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly id: number;

  @ApiProperty({
    description: 'Update dto of a TemplateMenuItem entity.',
    type: UpdateTemplateMenuItemDto,
    example: {
      displayName: 'CLAPPLE',
      menuItemId: 1,
      tablePosIndex: 0,
    },
  })
  @ValidateNested()
  @Type(() => UpdateTemplateMenuItemDto)
  readonly dto: UpdateTemplateMenuItemDto;
}
