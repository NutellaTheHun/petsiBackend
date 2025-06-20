import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateChildTemplateMenuItemDto {
  @ApiProperty({
    description:
      'Declare whether creating or updating a child entity. Relevant when creating/updating a Template entity.',
    example: 'update',
  })
  @IsNotEmpty()
  readonly mode: 'update' = 'update';

  @ApiProperty({
    description: 'Id of the TemplateMenuItem entity to be updated.',
    example: 1,
  })
  @IsPositive()
  @IsNumber()
  @IsNotEmpty()
  readonly id: number;

  @ApiPropertyOptional({
    description:
      'Name to be used on the baking list representing the referenced MenuItem.',
    example: 'CRUMB',
  })
  @IsString()
  @IsOptional()
  readonly displayName?: string;

  @ApiPropertyOptional({
    description: 'Id of the MenuItem entity being displayed on the Template.',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly menuItemId?: number;

  @ApiPropertyOptional({
    description:
      'The row position of the TemplateMenuItem on the parent Template.',
    example: 3,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly tablePosIndex?: number;
}
