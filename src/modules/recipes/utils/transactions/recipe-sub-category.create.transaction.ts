import { EntityManager } from 'typeorm';
import { CreateRecipeSubCategoryDto } from '../../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { RecipeSubCategory } from '../../entities/recipe-sub-category.entity';

export async function RecipeSubCategoryCreateInTransaction(
  dto: CreateRecipeSubCategoryDto,
  manager: EntityManager,
): Promise<RecipeSubCategory> {
  const result = manager.create(RecipeSubCategory, {
    subCategoryName: dto.subCategoryName,
    parentCategory: { id: dto.parentCategoryId },
  });
  return result;
}
