import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { NestedTemplateMenuItemDto } from '../template-menu-item/nested-template-menu-item.dto copy';

export class UpdateTemplateDto {
  @ApiPropertyOptional({
    description: 'Name of the Template entity.',
    example: 'Spring Pastries',
  })
  @IsString()
  @IsOptional()
  readonly templateName?: string;

  @ApiPropertyOptional({
    description:
      'If the template displays a list of pies. Templates display either Pies or Pastries.',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  readonly isPie?: boolean;

  @ApiPropertyOptional({
    description:
      'Mixed array of CreateChildTemplateMenuItemDtos and UpdateChildTemplateMenuItemDto, child dtos are used when updating a Template entity with created/updated child TemplateMenuItem entites.',
    type: [NestedTemplateMenuItemDto],
    example: [
      {
        mode: 'create',
        createDto: {
          displayName: 'CLAPPLE',
          menuItemId: 1,
          tablePosIndex: 0,
        },
      },
      {
        mode: 'update',
        id: 3,
        updateDto: {
          displayName: 'MIX',
          menuItemId: 2,
          tablePosIndex: 1,
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly templateItemDtos?: NestedTemplateMenuItemDto[];
}
