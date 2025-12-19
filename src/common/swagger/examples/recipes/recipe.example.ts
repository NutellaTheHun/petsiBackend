import { handleSetHas, handleShallow } from '../handlers/handlers';
import { menuItemExample } from '../menu-items/menu-item.example';
import { unitOfMeasureExample } from '../unit-of-measure/unit-of-measure.example';
import { recipeCategoryExample } from './recipe-category.example';
import { recipeIngredientExample } from './recipe-ingredient.example';
import { recipeSubCategoryExample } from './recipe-sub-category.example';

export function recipeExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(recipeExample.name);
  return {
    id: 1,

    recipeName: 'Classic Apple Pie',

    producedMenuItem: handleShallow(shallow, fnSet, menuItemExample, false),

    isIngredient: false,

    ingredients: [handleSetHas(shallow, fnSet, recipeIngredientExample, false)],

    batchResultQuantity: 2,

    batchResultUnitOfMeasurement: handleShallow(
      shallow,
      fnSet,
      unitOfMeasureExample,
      false,
    ),

    servingSizeQuantity: 3,

    servingSizeUnitOfMeasurement: handleShallow(
      shallow,
      fnSet,
      unitOfMeasureExample,
      false,
    ),

    salesPrice: '3.99',

    category: handleSetHas(shallow, fnSet, recipeCategoryExample, false),

    subCategory: handleSetHas(shallow, fnSet, recipeSubCategoryExample, false),
  };
}
