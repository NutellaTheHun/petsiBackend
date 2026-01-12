import { EntityManager, EntityTarget } from 'typeorm';
import { ComposerBase } from '../../../../common/base/composer.base';
import { CreateRecipeSubCategoryDto } from '../../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { NestedCreateRecipeSubCategoryDto } from '../../dto/recipe-sub-category/nested-create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../../dto/recipe-sub-category/update-recipe-sub-category.dto';
import {
  RecipeSubCategory,
  RecipeSubCategoryEntity,
} from '../../entities/recipe-sub-category.entity';

export class RecipeSubCategoryComposer extends ComposerBase<RecipeSubCategoryEntity> {
  protected entityClass: EntityTarget<RecipeSubCategory>;

  protected async createInTransaction(
    dto: CreateRecipeSubCategoryDto,
    manager: EntityManager,
  ): Promise<RecipeSubCategory> {
    const result = manager.create(RecipeSubCategory, {
      name: dto.name,
      parentCategory: { id: dto.parentCategoryId },
    });
    return result;
  }

  protected async updateInTransaction(
    dto: UpdateRecipeSubCategoryDto,
    manager: EntityManager,
    entity: RecipeSubCategory,
  ): Promise<void> {
    if (dto.name !== undefined) {
      entity.name = dto.name;
    }
  }

  protected resolveCreateDto(
    dto: NestedCreateRecipeSubCategoryDto,
    context?: ResolverContext,
  ): CreateRecipeSubCategoryDto {
    if (!context?.parentCategoryId) {
      throw new Error('Parent category id is required');
    }
    return {
      name: dto.name,
      parentCategoryId: context.parentCategoryId,
    };
  }
}
