import { recipeExample } from './recipe.example';

export function recipeCategoryExample(fnSet: Set<string>) {
  fnSet.add(recipeCategoryExample.name);
  return {
    id: 1,
    categoryName: 'Pie',
    subCategories: fnSet.has(recipeCategoryExample.name)
      ? undefined
      : recipeCategoryExample(fnSet),
    recipes: fnSet.has(recipeExample.name) ? undefined : recipeExample(fnSet),
  };
}
