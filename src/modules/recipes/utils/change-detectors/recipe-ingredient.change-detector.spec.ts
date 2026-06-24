import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';
import { AppUnit } from '../../../../common/units';
import { Recipe } from '../../entities/recipe.entity';
import { RecipeIngredient } from '../../entities/recipe-ingredient.entity';

const stubParentRecipe = (): Recipe => ({ id: 0 } as Recipe);
import {
    recipeIngredientToNestedUpdateDto,
    recipeIngredientToUpdateDto,
} from '../entity-transformers/recipe-ingredient.dto.transformer';
import { RecipeIngredientChangeDetector } from './recipe-ingredient.change-detector';

describe('RecipeIngredientChangeDetector', () => {
    const detector = new RecipeIngredientChangeDetector();

    const baseEntity = (): RecipeIngredient =>
        ({
            id: 1,
            parentRecipe: stubParentRecipe(),
            ingredientInventoryItem: { id: 10 } as InventoryItem,
            ingredientRecipe: null,
            quantity: 2,
            unit: 'oz' as AppUnit,
        } as RecipeIngredient);

    it('returns empty patch for UpdateDto when dto matches entity', () => {
        const entity = baseEntity();
        const dto = recipeIngredientToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('returns empty patch for NestedUpdateDto when dto matches entity', () => {
        const entity = baseEntity();
        const dto = recipeIngredientToNestedUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({ id: 1 });
    });

    it('detects quantity and unit changes', () => {
        const entity = baseEntity();
        const dto = recipeIngredientToNestedUpdateDto(entity, { quantity: 5, unit: 'kg' });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ id: 1, quantity: 5, unit: 'kg' });
    });

    it('detects switch to recipe ingredient', () => {
        const entity = baseEntity();
        const dto = recipeIngredientToNestedUpdateDto(entity, {
            ingredientInventoryItemId: null,
            ingredientRecipeId: 99,
        });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toMatchObject({
            id: 1,
            ingredientInventoryItemId: null,
            ingredientRecipeId: 99,
        });
    });
});
