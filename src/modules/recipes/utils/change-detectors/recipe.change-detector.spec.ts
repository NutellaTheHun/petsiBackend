import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { UnitOfMeasure } from '../../../unit-of-measure/entities/unit-of-measure.entity';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';
import { RecipeCategory } from '../../entities/recipe-category.entity';
import { RecipeSubCategory } from '../../entities/recipe-sub-category.entity';
import { RecipeIngredient } from '../../entities/recipe-ingredient.entity';
import { Recipe } from '../../entities/recipe.entity';

const stubRecipe = (): Recipe => ({ id: 0 } as Recipe);
import { UpdateRecipeDto } from '../../dto/recipe/update-recipe-dto';
import { recipeIngredientToNestedUpdateDto } from '../entity-transformers/recipe-ingredient.dto.transformer';
import { recipeToUpdateDto } from '../entity-transformers/recipe.dto.transformer';
import { RecipeIngredientChangeDetector } from './recipe-ingredient.change-detector';
import { RecipeChangeDetector } from './recipe.change-detector';

describe('RecipeChangeDetector', () => {
    const detector = new RecipeChangeDetector(new RecipeIngredientChangeDetector());

    const ingredient = (id: number): RecipeIngredient =>
        ({
            id,
            parentRecipe: stubRecipe(),
            ingredientInventoryItem: { id: 100 } as InventoryItem,
            ingredientRecipe: null,
            quantity: 1,
            quantityUnitType: { id: 200 } as UnitOfMeasure,
        } as RecipeIngredient);

    const baseEntity = (): Recipe =>
        ({
            id: 1,
            name: 'Apple pie',
            producedMenuItem: { id: 1 } as MenuItem,
            batchResultQuantity: 1,
            batchResultUnitType: { id: 2 } as UnitOfMeasure,
            servingSizeQuantity: 2,
            servingSizeUnitType: { id: 3 } as UnitOfMeasure,
            salesPrice: '12.00',
            isIngredient: false,
            category: { id: 10 } as RecipeCategory,
            subCategory: { id: 20 } as RecipeSubCategory,
            ingredients: [ingredient(30)],
        } as Recipe);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = recipeToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects root field changes without ingredient changes', () => {
        const entity = baseEntity();
        const dto = recipeToUpdateDto(entity, { name: 'Cherry pie', salesPrice: 15 });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toMatchObject({ name: 'Cherry pie', salesPrice: 15 });
        expect(result.patch.ingredients).toBeUndefined();
    });

    it('includes new ingredient create rows', () => {
        const entity = { ...baseEntity(), ingredients: [] };
        const createIng = {
            createId: 'c1',
            ingredientInventoryItemId: 101,
            quantity: 2,
            quantityUnitTypeId: 200,
        };
        const dto = recipeToUpdateDto(entity, { ingredients: [createIng] });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.ingredients).toEqual([createIng]);
    });

    it('patches only changed ingredient child', () => {
        const entity = baseEntity();
        const ing = ingredient(30);
        const dto: UpdateRecipeDto = {
            ...recipeToUpdateDto(entity),
            ingredients: [recipeIngredientToNestedUpdateDto(ing, { quantity: 9 })],
        };
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.ingredients).toEqual([{ id: 30, quantity: 9 }]);
    });
});
