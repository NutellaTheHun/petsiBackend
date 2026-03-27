import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { NestedUpdateRecipeSubCategoryDto } from '../../dto/recipe-sub-category/nested-update-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../../dto/recipe-sub-category/update-recipe-sub-category.dto';
import { RecipeSubCategory } from '../../entities/recipe-sub-category.entity';
import { recipeSubCategoryToNestedUpdateDto, recipeSubCategoryToUpdateDto } from '../entity-transformers/recipe-sub-category.dto.transformer';

@Injectable()
export class RecipeSubCategoryChangeDetector extends ChangeDetectorBase<
  RecipeSubCategory,
  UpdateRecipeSubCategoryDto | NestedUpdateRecipeSubCategoryDto
> {
  detect(
    entity: RecipeSubCategory,
    dto: UpdateRecipeSubCategoryDto | NestedUpdateRecipeSubCategoryDto,
  ): ChangeDetectionResult<UpdateRecipeSubCategoryDto | NestedUpdateRecipeSubCategoryDto> {
    const existing = 'id' in dto ? recipeSubCategoryToNestedUpdateDto(entity) : recipeSubCategoryToUpdateDto(entity);
    const patch: MutablePartial<UpdateRecipeSubCategoryDto | NestedUpdateRecipeSubCategoryDto> =
      'id' in dto ? { id: dto.id } : {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(existing.name, dto.name)) {
      patch.name = dto.name;
      changes.push({ path: 'name', previousValue: existing.name, nextValue: dto.name });
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }
}
