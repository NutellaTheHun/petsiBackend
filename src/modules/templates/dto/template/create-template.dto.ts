import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateChildTemplateMenuItemDto } from '../template-menu-item/create-child-template-menu-item.dto';

export class CreateTemplateDto {
  @ApiProperty({
    description: 'Name of the Template entity.',
    example: 'Summer Pies',
  })
  @IsString()
  @IsNotEmpty()
  readonly templateName: string;

  @ApiProperty({
    description:
      'If the template displays a list of pies. Templates display either Pies or Pastries.',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  readonly isPie?: boolean;

  @ApiProperty({
    description:
      'Array of CreateChildTemplateMenuItemDtos, child dtos are used when creating a Template entity with child TemplateMenuItem entites.',
    type: [CreateChildTemplateMenuItemDto],
    example: [
      {
        mode: 'create',
        displayName: 'CLAPPLE',
        menuItemId: 1,
        tablePosIndex: 0,
      },
      {
        mode: 'create',
        displayName: 'MIX',
        menuItemId: 2,
        tablePosIndex: 1,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  templateItemDtos?: CreateChildTemplateMenuItemDto[];
}
