import { CreateChildRecipeSubCategoryDto } from "../dto/create-child-recipe-sub-category.dto";
import { UpdateChildRecipeSubCategoryDto } from "../dto/update-child-recipe-sub-category.dto copy";

export function RecipeSubCategoryUnionResolver(obj: any) {
    if (obj?.mode === 'update') return UpdateChildRecipeSubCategoryDto;
    return CreateChildRecipeSubCategoryDto;
}