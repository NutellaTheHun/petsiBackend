import { EntityManager, EntityTarget } from 'typeorm';
import { ComposerBase } from '../../../../common/base/composer.base';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';
import { UnitOfMeasure } from '../../../unit-of-measure/entities/unit-of-measure.entity';
import { CreateRecipeIngredientDto } from '../../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { NestedCreateRecipeIngredientDto } from '../../dto/recipe-ingredient/nested-create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../../dto/recipe-ingredient/update-recipe-ingedient.dto';
import {
  RecipeIngredient,
  RecipeIngredientEntity,
} from '../../entities/recipe-ingredient.entity';
import { Recipe } from '../../entities/recipe.entity';

export class RecipeIngredientComposer extends ComposerBase<RecipeIngredientEntity> {
  protected entityClass: EntityTarget<RecipeIngredient>;

  protected async createInTransaction(
    dto: CreateRecipeIngredientDto,
    manager: EntityManager,
  ): Promise<RecipeIngredient> {
    const result = manager.create(RecipeIngredient, {
      parentRecipe: { id: dto.parentRecipeId },

      ingredientInventoryItem: dto.ingredientInventoryItemId
        ? { id: dto.ingredientInventoryItemId }
        : null,

      ingredientRecipe: dto.ingredientRecipeId
        ? { id: dto.ingredientRecipeId }
        : null,

      quantity: dto.quantity,

      quantityMeasure: { id: dto.quantityUnitTypeId },
    });

    return result;
  }

  protected async updateInTransaction(
    dto: UpdateRecipeIngredientDto,
    manager: EntityManager,
    entity: RecipeIngredient,
  ): Promise<void> {
    if (dto.ingredientInventoryItemId !== undefined) {
      entity.ingredientInventoryItem = manager.create(InventoryItem, {
        id: dto.ingredientInventoryItemId,
      });
      entity.ingredientRecipe = null;
    } else if (dto.ingredientRecipeId) {
      entity.ingredientRecipe = manager.create(Recipe, {
        id: dto.ingredientRecipeId,
      });
      entity.ingredientInventoryItem = null;
    }

    if (dto.quantity !== undefined) {
      entity.quantity = dto.quantity;
    }

    if (dto.quantityUnitTypeId !== undefined) {
      entity.quantityUnitType = manager.create(UnitOfMeasure, {
        id: dto.quantityUnitTypeId,
      });
    }
  }

  protected resolveCreateDto(
    dto: NestedCreateRecipeIngredientDto,
    context?: ResolverContext,
  ): CreateRecipeIngredientDto {
    if (!context?.parentRecipeId) {
      throw new Error('Parent recipe id is required');
    }
    return {
      parentRecipeId: context.parentRecipeId,
      ingredientInventoryItemId: dto.ingredientInventoryItemId,
      ingredientRecipeId: dto.ingredientRecipeId,
      quantity: dto.quantity,
      quantityUnitTypeId: dto.quantityUnitTypeId,
    };
  }
}
