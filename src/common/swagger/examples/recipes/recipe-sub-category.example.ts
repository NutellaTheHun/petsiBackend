import { handleSetHas } from '../handlers/handlers';
import { recipeCategoryExample } from './recipe-category.example';
import { recipeExample } from './recipe.example';

export function recipeSubCategoryExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(recipeSubCategoryExample.name);
  return {
    id: 1,

    subCategoryName: 'Savory Pie',

    parentCategory: handleSetHas(shallow, fnSet, recipeCategoryExample, true),

    recipes: [handleSetHas(shallow, fnSet, recipeExample, false)],
  };
}
