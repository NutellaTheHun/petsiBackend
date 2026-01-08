import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NestedCreateRecipeSubCategoryDto } from '../recipe-sub-category/nested-create-recipe-sub-category.dto';
import { NestedRecipeSubCategoryDto } from '../recipe-sub-category/nested-recipe-sub-category.dto';

export class CreateRecipeCategoryDto {
  @ApiProperty({
    description: 'Name of the RecipeCategory entity.',
    example: 'Pies',
  })
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @ApiPropertyOptional({
    description:
      'Array of CreateChildRecipeSubCategoryDtos, child dtos are used when creating the parent RecipeCategory with child RecipeSubCategory entities.',
    type: [NestedRecipeSubCategoryDto],
    example: [
      {
        createId: 'c1',
        name: 'savory pies',
      },
      {
        createId: 'c2',
        name: 'sweet pies',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  readonly subCategories?: NestedCreateRecipeSubCategoryDto[];
}
