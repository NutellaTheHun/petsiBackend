import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRecipeSubCategoryDto {
  @ApiProperty({
    description: 'Name of the RecipeSubCategory entity.',
    example: 'name',
  })
  @IsString()
  @IsOptional()
  readonly subCategoryName?: string;
}
