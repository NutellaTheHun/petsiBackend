import { ApiPropertyOptional } from '@nestjs/swagger';
import { NestedDtoBase } from '../../../../common/base/nested-dto.base';
import { CreateRecipeSubCategoryDto } from './create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from './update-recipe-sub-category.dto';

export class NestedRecipeSubCategoryDto extends NestedDtoBase<
  CreateRecipeSubCategoryDto,
  UpdateRecipeSubCategoryDto
> {
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
