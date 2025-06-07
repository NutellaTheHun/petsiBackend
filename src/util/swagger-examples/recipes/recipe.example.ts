import { menuItemExample } from '../menu-items/menu-item.example';
import { unitOfMeasureExample } from '../unit-of-measure/unit-of-measure.example';
import { recipeCategoryExample } from './recipe-category.example';
import { recipeIngredientExample } from './recipe-ingredient.example';
import { recipeSubCategoryExample } from './recipe-sub-category.example';

export function recipeExample(fnSet: Set<string>) {
  fnSet.add(recipeExample.name);
  return {
    id: 1,
    recipeName: 'Classic Apple Pie',
    producedMenuItem: menuItemExample(fnSet),
    isIngredient: false,
    ingredients: fnSet.has(recipeIngredientExample.name)
      ? undefined
      : [recipeIngredientExample(fnSet)],
    batchResultQuantity: 2,
    batchResultUnitOfMeasurement: unitOfMeasureExample(fnSet),
    servingSizeQuantity: 3,
    servingSizeUnitOfMeasurement: unitOfMeasureExample(fnSet),
    salesPrice: '3.99',
    category: fnSet.has(recipeCategoryExample.name)
      ? undefined
      : recipeCategoryExample(fnSet),
    subCategory: fnSet.has(recipeSubCategoryExample.name)
      ? undefined
      : recipeSubCategoryExample(fnSet),
  };
}
