import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TemplateMenuItemUnionResolver } from '../../utils/template-menu-item-union-resolver';
import { CreateChildTemplateMenuItemDto } from '../template-menu-item/create-child-template-menu-item.dto';
import { UpdateChildTemplateMenuItemDto } from '../template-menu-item/update-child-template-menu-item.dto';

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
    type: [UpdateChildTemplateMenuItemDto],
    example: [
      {
        mode: 'create',
        displayName: 'CLAPPLE',
        menuItemId: 1,
        tablePosIndex: 0,
      },
      {
        mode: 'update',
        id: 3,
        displayName: 'MIX',
        menuItemId: 2,
        tablePosIndex: 1,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateMenuItemUnionResolver)
  readonly templateItemDtos?: (
    | CreateChildTemplateMenuItemDto
    | UpdateChildTemplateMenuItemDto
  )[];
}
