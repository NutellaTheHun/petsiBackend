import { EntityManager } from 'typeorm';
import { CreateRecipeIngredientDto } from '../../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { RecipeIngredient } from '../../entities/recipe-ingredient.entity';

export async function RecipeIngredientCreateInTransaction(
  dto: CreateRecipeIngredientDto,
  manager: EntityManager,
): Promise<RecipeIngredient> {
  const result = manager.create(RecipeIngredient, {
    ...(dto.parentRecipeId && {
      parentRecipe: { id: dto.parentRecipeId },
    }),

    ingredientInventoryItem: dto.ingredientInventoryItemId
      ? { id: dto.ingredientInventoryItemId }
      : null,

    ingredientRecipe: dto.ingredientRecipeId
      ? { id: dto.ingredientRecipeId }
      : null,

    quantity: dto.quantity,

    quantityMeasure: { id: dto.quantityMeasurementId },
  });

  return result;
}
