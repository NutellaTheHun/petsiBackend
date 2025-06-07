import { inventoryItemExample } from '../inventory-items/inventory-item.example';
import { unitOfMeasureExample } from '../unit-of-measure/unit-of-measure.example';
import { recipeExample } from './recipe.example';

export function recipeIngredientExample(fnSet: Set<string>) {
  fnSet.add(recipeIngredientExample.name);
  return {
    id: 1,
    parentRecipe: fnSet.has(recipeExample.name)
      ? undefined
      : recipeExample(fnSet),
    ingredientInventoryItem: inventoryItemExample(fnSet, true),
    ingredientRecipe: null,
    quantity: 2,
    quantityMeasure: unitOfMeasureExample(fnSet),
  };
}
