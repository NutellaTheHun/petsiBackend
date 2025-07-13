import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateRecipeSubCategoryDto } from '../recipe-sub-category/create-recipe-sub-category.dto';

export class CreateRecipeCategoryDto {
  @ApiProperty({
    description: 'Name of the RecipeCategory entity.',
    example: 'Pies',
  })
  @IsString()
  @IsNotEmpty()
  readonly categoryName: string;

  @ApiPropertyOptional({
    description:
      'Array of CreateChildRecipeSubCategoryDtos, child dtos are used when creating the parent RecipeCategory with child RecipeSubCategory entities.',
    type: [CreateRecipeSubCategoryDto],
    example: [
      {
        mode: 'create',
        subCategoryName: 'savory pies',
      },
      {
        mode: 'create',
        subCategoryName: 'sweet pies',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  readonly subCategoryDtos?: CreateRecipeSubCategoryDto[];
}
