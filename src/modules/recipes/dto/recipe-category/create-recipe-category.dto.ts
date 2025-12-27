import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
        mode: 'create',
        createId: 'c1',
        createDto: {
          subCategoryName: 'savory pies',
        },
      },
      {
        mode: 'create',
        createId: 'c2',
        createDto: {
          subCategoryName: 'sweet pies',
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  readonly subCategories?: NestedRecipeSubCategoryDto[];
}
