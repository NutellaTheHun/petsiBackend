import { EntityManager } from 'typeorm';
import { UpdateRecipeSubCategoryDto } from '../../dto/recipe-sub-category/update-recipe-sub-category.dto';
import { RecipeSubCategory } from '../../entities/recipe-sub-category.entity';

export async function RecipeSubCategoryUpdateInTransaction(
  dto: UpdateRecipeSubCategoryDto,
  manager: EntityManager,
  entity: RecipeSubCategory,
): Promise<void> {
  if (dto.subCategoryName !== undefined) {
    entity.subCategoryName = dto.subCategoryName;
  }
}
