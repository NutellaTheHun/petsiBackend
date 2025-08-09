import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { CreateRecipeSubCategoryDto } from './create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from './update-recipe-sub-category.dto';

export class NestedRecipeSubCategoryDto {
  @ApiProperty({
    description: 'Determines if this dto is to update or create a resource',
    example: 'create',
    enum: ['create', 'update'],
  })
  @IsNotEmpty()
  readonly mode: 'create' | 'update';

  @ApiPropertyOptional({
    description: 'Id for RecipeSubCategory entity when updating',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  readonly id?: number;

  @ApiPropertyOptional({
    description: 'Create dto of a RecipeSubCategory entity.',
    type: CreateRecipeSubCategoryDto,
    example: {
      subCategoryName: 'created Sub Category',
    },
  })
  readonly createDto?: CreateRecipeSubCategoryDto;

  @ApiPropertyOptional({
    description: 'Update dto of a RecipeSubCategory entity.',
    type: UpdateRecipeSubCategoryDto,
    example: {
      subCategoryName: 'Updated Sub Category',
    },
  })
  readonly updateDto?: UpdateRecipeSubCategoryDto;
}
