import { handleSetHas } from '../handlers/handlers';
import { recipeExample } from './recipe.example';

export function recipeCategoryExample(fnSet: Set<string>, shallow: boolean) {
  fnSet.add(recipeCategoryExample.name);
  return {
    id: 1,

    categoryName: 'Pie',

    subCategories: [handleSetHas(shallow, fnSet, recipeCategoryExample, false)],

    recipes: [handleSetHas(shallow, fnSet, recipeExample, false)],
  };
}
