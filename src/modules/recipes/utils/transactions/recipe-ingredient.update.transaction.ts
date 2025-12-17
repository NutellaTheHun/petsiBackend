import { EntityManager } from 'typeorm';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';
import { UnitOfMeasure } from '../../../unit-of-measure/entities/unit-of-measure.entity';
import { UpdateRecipeIngredientDto } from '../../dto/recipe-ingredient/update-recipe-ingedient.dto';
import { RecipeIngredient } from '../../entities/recipe-ingredient.entity';
import { Recipe } from '../../entities/recipe.entity';

export async function RecipeIngredientUpdateInTransaction(
  dto: UpdateRecipeIngredientDto,
  manager: EntityManager,
  entity: RecipeIngredient,
): Promise<void> {
  if (dto.ingredientInventoryItemId !== undefined) {
    entity.ingredientInventoryItem = manager.create(InventoryItem, {
      id: dto.ingredientInventoryItemId,
    });
    entity.ingredientRecipe = null;
  } else if (dto.ingredientRecipeId) {
    entity.ingredientRecipe = manager.create(Recipe, {
      id: dto.ingredientRecipeId,
    });
    entity.ingredientInventoryItem = null;
  }

  if (dto.quantity !== undefined) {
    entity.quantity = dto.quantity;
  }

  if (dto.quantityMeasureTypeId !== undefined) {
    entity.quantityMeasureType = manager.create(UnitOfMeasure, {
      id: dto.quantityMeasureTypeId,
    });
  }
}
