import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { NestedUpdateRecipeIngredientDto } from '../../dto/recipe-ingredient/nested-update-recipe-ingedient.dto';
import { UpdateRecipeIngredientDto } from '../../dto/recipe-ingredient/update-recipe-ingedient.dto';
import { RecipeIngredient } from '../../entities/recipe-ingredient.entity';
import { recipeIngredientToNestedUpdateDto, recipeIngredientToUpdateDto } from '../entity-transformers/recipe-ingredient.dto.transformer';

@Injectable()
export class RecipeIngredientChangeDetector extends ChangeDetectorBase<
  RecipeIngredient,
  UpdateRecipeIngredientDto | NestedUpdateRecipeIngredientDto
> {
  detect(
    entity: RecipeIngredient,
    dto: UpdateRecipeIngredientDto | NestedUpdateRecipeIngredientDto,
  ): ChangeDetectionResult<UpdateRecipeIngredientDto | NestedUpdateRecipeIngredientDto> {
    const existing = 'id' in dto ? recipeIngredientToNestedUpdateDto(entity) : recipeIngredientToUpdateDto(entity);
    const patch: MutablePartial<UpdateRecipeIngredientDto | NestedUpdateRecipeIngredientDto> =
      'id' in dto ? { id: dto.id } : {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(existing.ingredientInventoryItemId ?? null, dto.ingredientInventoryItemId ?? null)) {
      patch.ingredientInventoryItemId = dto.ingredientInventoryItemId;
      changes.push({
        op: 'reference',
        path: 'ingredientInventoryItemId',
        previousValue: existing.ingredientInventoryItemId ?? null,
        nextValue: dto.ingredientInventoryItemId ?? null,
      });
    }
    if (!this.unchanged(existing.ingredientRecipeId ?? null, dto.ingredientRecipeId ?? null)) {
      patch.ingredientRecipeId = dto.ingredientRecipeId;
      changes.push({
        op: 'reference',
        path: 'ingredientRecipeId',
        previousValue: existing.ingredientRecipeId ?? null,
        nextValue: dto.ingredientRecipeId ?? null,
      });
    }
    if (!this.unchanged(existing.quantity, dto.quantity)) {
      patch.quantity = dto.quantity;
      changes.push({
        op: 'scalar',
        path: 'quantity',
        previousValue: existing.quantity,
        nextValue: dto.quantity,
      });
    }
    if (!this.unchanged(existing.quantityUnitTypeId, dto.quantityUnitTypeId)) {
      patch.quantityUnitTypeId = dto.quantityUnitTypeId;
      changes.push({
        op: 'reference',
        path: 'quantityUnitTypeId',
        previousValue: existing.quantityUnitTypeId,
        nextValue: dto.quantityUnitTypeId,
      });
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }
}
