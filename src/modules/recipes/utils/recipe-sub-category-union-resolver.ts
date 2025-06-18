import { plainToInstance } from 'class-transformer';
import { CreateChildRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-child-recipe-sub-category.dto';
import { UpdateChildRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-child-recipe-sub-category.dto copy';

export function RecipeSubCategoryUnionResolver(obj: any) {
  if (obj?.mode === 'update')
    return plainToInstance(UpdateChildRecipeSubCategoryDto, obj);
  return plainToInstance(CreateChildRecipeSubCategoryDto, obj);
}
