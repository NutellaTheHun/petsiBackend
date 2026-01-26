import { AggregateValidatorBase } from '../../../../common/base/aggregate-validator.base';
import { RecipeIngredientEntity } from '../../entities/recipe-ingredient.entity';

export class RecipeIngredientAggregateValidator extends AggregateValidatorBase<RecipeIngredientEntity> {
  protected entityKey(entity: RecipeIngredientEntity['__Entity']): string {
    return this.entityIngredientKey(entity);
  }
  protected createDtoKey(dto: RecipeIngredientEntity['__NcDto']): string {
    return this.dtoIngredientKey(dto);
  }
  protected applyUpdateKey(
    entity: RecipeIngredientEntity['__Entity'],
    dto: RecipeIngredientEntity['__NuDto'],
  ): string {
    return this.entityIngredientKey({
      ingredientInventoryItem: dto.ingredientInventoryItemId
        ? { id: dto.ingredientInventoryItemId }
        : entity.ingredientInventoryItem,
      ingredientRecipe: dto.ingredientRecipeId
        ? { id: dto.ingredientRecipeId }
        : entity.ingredientRecipe,
    } as any);
  }

  // Helpers
  private entityIngredientKey(
    entity: RecipeIngredientEntity['__Entity'],
  ): string {
    return `${entity.ingredientInventoryItem?.id ?? 0}:${entity.ingredientRecipe?.id ?? 0}`;
  }

  private dtoIngredientKey(dto: RecipeIngredientEntity['__NcDto']): string {
    return `${dto.ingredientInventoryItemId ?? 0}:${dto.ingredientRecipeId ?? 0}`;
  }
}
