import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { NestedDtoBase } from '../../../../common/base/nested-dto.base';
import { CreateTemplateMenuItemDto } from './create-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from './update-template-menu-item.dto';

export class NestedTemplateMenuItemDto extends NestedDtoBase<
  CreateTemplateMenuItemDto,
  UpdateTemplateMenuItemDto
> {
  @ApiPropertyOptional({
    description: 'Create dto of a TemplateMenuItem entity.',
    type: CreateTemplateMenuItemDto,
    example: {
      displayName: 'CLAPPLE',
      menuItemId: 1,
      tablePosIndex: 0,
      templateId: 1,
    },
  })
  @ValidateNested()
  @Type(() => CreateTemplateMenuItemDto)
  readonly createDto?: CreateTemplateMenuItemDto;

  @ApiPropertyOptional({
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
  readonly updateDto?: UpdateTemplateMenuItemDto;
}
