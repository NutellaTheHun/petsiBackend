import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CreateTemplateMenuItemDto } from './create-template-menu-item.dto';
import { NestedUpdateTemplateMenuItemDto } from './nested-update-template-menu-item.dto';

export class NestedTemplateMenuItemDto {
  @ApiProperty({
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
  readonly create: CreateTemplateMenuItemDto;

  @ApiProperty({
    description: 'Update dto of a TemplateMenuItem entity.',
    type: NestedUpdateTemplateMenuItemDto,
    example: {
      id: 1,
      dto: {
        displayName: 'CLAPPLE',
        menuItemId: 1,
        tablePosIndex: 0,
      },
    },
  })
  @ValidateNested()
  @Type(() => NestedUpdateTemplateMenuItemDto)
  readonly update: NestedUpdateTemplateMenuItemDto;
}
