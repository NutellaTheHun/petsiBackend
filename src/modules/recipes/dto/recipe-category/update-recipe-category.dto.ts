import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRecipeCategoryDto {
  @ApiPropertyOptional({
    description: 'Name of the RecipeCategory entity.',
    example: 'Pies',
  })
  @IsString()
  @IsOptional()
  readonly categoryName?: string;
}
