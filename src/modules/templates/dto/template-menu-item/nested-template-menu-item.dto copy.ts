import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateTemplateMenuItemDto } from './create-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from './update-template-menu-item.dto';

export class NestedTemplateMenuItemDto {
  @ApiProperty({
    description: 'Determines if this dto is to update or create a resource',
    example: 'create',
    enum: ['create', 'update'],
  })
  @IsNotEmpty()
  readonly mode: 'create' | 'update';

  @ApiPropertyOptional({
    description: 'Id for TemplateMenuItem entity when updating',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  readonly id?: number;

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
