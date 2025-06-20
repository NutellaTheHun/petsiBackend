import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateTemplateMenuItemDto {
  @ApiPropertyOptional({
    description:
      'Name to be used on the baking list representing the referenced MenuItem.',
    example: 'POTM',
  })
  @IsString()
  @IsOptional()
  readonly displayName?: string;

  @ApiPropertyOptional({
    description: 'Id of the MenuItem entity being displayed on the Template.',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly menuItemId?: number;

  @ApiPropertyOptional({
    description:
      'The row position of the TemplateMenuItem on the parent Template.',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly tablePosIndex?: number;

  @ApiPropertyOptional({
    description: 'Id of the parent Template entity.',
    example: 3,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly templateId?: number;
}
