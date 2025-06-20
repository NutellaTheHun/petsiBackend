import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateChildRecipeSubCategoryDto } from '../recipe-sub-category/create-child-recipe-sub-category.dto';

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
    type: [CreateChildRecipeSubCategoryDto],
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
  readonly subCategoryDtos?: CreateChildRecipeSubCategoryDto[];
}
