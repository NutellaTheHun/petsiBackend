import { recipeCategoryExample } from './recipe-category.example';
import { recipeExample } from './recipe.example';

export function recipeSubCategoryExample(fnSet: Set<string>) {
  fnSet.add(recipeSubCategoryExample.name);
  return {
    id: 1,
    subCategoryName: 'Savory Pie',
    parentCategory: fnSet.has(recipeCategoryExample.name)
      ? undefined
      : recipeCategoryExample(fnSet),
    recipes: fnSet.has(recipeExample.name) ? undefined : recipeExample(fnSet),
  };
}
