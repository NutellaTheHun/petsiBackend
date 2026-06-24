import { EntityManager } from 'typeorm';
import { ComposerBase } from '../../../../common/base/composer.base';
import { ResolverContext } from '../../../../common/types/resolver-context.type';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';
import { CreateRecipeIngredientDto } from '../../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { NestedCreateRecipeIngredientDto } from '../../dto/recipe-ingredient/nested-create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../../dto/recipe-ingredient/update-recipe-ingedient.dto';
import {
    RecipeIngredient,
    RecipeIngredientEntity,
} from '../../entities/recipe-ingredient.entity';
import { Recipe } from '../../entities/recipe.entity';

export class RecipeIngredientComposer extends ComposerBase<RecipeIngredientEntity> {
    protected readonly entityClass = RecipeIngredient;

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

            unit: dto.unit,
        });

        return result;
    }

    protected async updateInTransaction(
        dto: UpdateRecipeIngredientDto,
        manager: EntityManager,
        entity: RecipeIngredient,
    ): Promise<void> {
        if (dto.ingredientInventoryItemId !== undefined) {
            if (dto.ingredientInventoryItemId === null) {
                entity.ingredientInventoryItem = null;
            } else {
                entity.ingredientInventoryItem = manager.create(InventoryItem, {
                    id: dto.ingredientInventoryItemId,
                });
                entity.ingredientRecipe = null;
            }
        }
        if (dto.ingredientRecipeId !== undefined) {
            if (dto.ingredientRecipeId === null) {
                entity.ingredientRecipe = null;
            } else {
                entity.ingredientRecipe = manager.create(Recipe, {
                    id: dto.ingredientRecipeId,
                });
                entity.ingredientInventoryItem = null;
            }
        }
        if (dto.quantity !== undefined) {
            entity.quantity = dto.quantity;
        }

        if (dto.unit !== undefined) {
            entity.unit = dto.unit;
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
            unit: dto.unit,
        };
    }
}
