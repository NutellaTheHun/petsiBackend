import { ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { NestedTemplateMenuItemDto } from '../template-menu-item/nested-template-menu-item.dto';

export class UpdateTemplateDto {
  @ApiPropertyOptional({
    description: 'Name of the Template entity.',
    example: 'Spring Pastries',
  })
  @IsString()
  @IsOptional()
  readonly name?: string;

  @ApiPropertyOptional({
    description:
      'If the template displays a list of pies. Templates display either Pies or Pastries.',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  readonly isPie?: boolean;

  @ApiPropertyOptional({
    description: 'TODO',
    type: 'array',
    oneOf: [
      { $ref: getSchemaPath(NestedTemplateMenuItemDto) },
      { $ref: getSchemaPath(NestedTemplateMenuItemDto) },
    ],
    example: [
      {
        createId: 'c1',
        displayName: 'CLAPPLE',
        menuItemId: 2,
        tablePosIndex: 0,
      },
      {
        id: 3,
        displayName: 'MIX',
        menuItemId: 4,
        tablePosIndex: 1,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly templateMenuItems?: (
    | NestedTemplateMenuItemDto
    | NestedTemplateMenuItemDto
  )[];
}
