import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { NestedRecipeSubCategoryDto } from '../recipe-sub-category/nested-recipe-sub-category.dto';

export class UpdateRecipeCategoryDto {
  @ApiPropertyOptional({
    description: 'Name of the RecipeCategory entity.',
    example: 'Pies',
  })
  @IsString()
  @IsOptional()
  readonly name?: string;

  @ApiPropertyOptional({
    description:
      'Array of CreateChildRecipeSubCategoryDtos, child dtos are used when creating the parent RecipeCategory with child RecipeSubCategory entities.',
    type: [NestedRecipeSubCategoryDto],
    example: [
      {
        mode: 'create',
        createId: 'c1',
        createDto: {
          subCategoryName: 'savory pies',
        },
      },
      {
        mode: 'update',
        id: 2,
        updateDto: {
          subCategoryName: 'sweet pies',
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  readonly subCategories?: NestedRecipeSubCategoryDto[];
}
