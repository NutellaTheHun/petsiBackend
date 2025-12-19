import { handleSetHas, handleShallow } from '../handlers/handlers';
import { inventoryItemExample } from '../inventory-items/inventory-item.example';
import { unitOfMeasureExample } from '../unit-of-measure/unit-of-measure.example';
import { recipeExample } from './recipe.example';

export function recipeIngredientExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(recipeIngredientExample.name);
  return {
    id: 1,

    parentRecipe: handleSetHas(shallow, fnSet, recipeExample, true),

    ingredientInventoryItem: handleShallow(
      shallow,
      fnSet,
      inventoryItemExample,
      false,
    ),

    ingredientRecipe: null,

    quantity: 2,

    quantityMeasure: handleShallow(shallow, fnSet, unitOfMeasureExample, false),
  };
}
