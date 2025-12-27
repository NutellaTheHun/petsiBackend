import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { NestedTemplateMenuItemDto } from '../template-menu-item/nested-template-menu-item.dto copy';

export class CreateTemplateDto {
  @ApiProperty({
    description: 'Name of the Template entity.',
    example: 'Summer Pies',
  })
  @IsString()
  @IsNotEmpty()
  readonly name: string;

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
      'Array of CreateChildTemplateMenuItemDtos, child dtos are used when creating a Template entity with child TemplateMenuItem entites.',
    type: [NestedTemplateMenuItemDto],
    example: [
      {
        mode: 'create',
        createId: 'c1',
        createDto: {
          displayName: 'CLAPPLE',
          menuItemId: 2,
          tablePosIndex: 0,
        },
      },
      {
        mode: 'create',
        createId: 'c3',
        createDto: {
          displayName: 'MIX',
          menuItemId: 4,
          tablePosIndex: 1,
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  readonly templateMenuItems?: NestedTemplateMenuItemDto[];
}
