import { UpdateRecipeCategoryDto } from '../../dto/recipe-category/update-recipe-category.dto';
import { RecipeCategory } from '../../entities/recipe-category.entity';
import { RecipeSubCategory } from '../../entities/recipe-sub-category.entity';
import { recipeCategoryToUpdateDto } from '../entity-transformers/recipe-category.dto.transformer';
import { recipeSubCategoryToNestedUpdateDto } from '../entity-transformers/recipe-sub-category.dto.transformer';
import { RecipeSubCategoryChangeDetector } from './recipe-sub-category.change-detector';
import { RecipeCategoryChangeDetector } from './recipe-category.change-detector';

describe('RecipeCategoryChangeDetector', () => {
    const detector = new RecipeCategoryChangeDetector(new RecipeSubCategoryChangeDetector());

    const sub = (id: number, name: string): RecipeSubCategory =>
        ({ id, name } as RecipeSubCategory);

    const baseEntity = (): RecipeCategory =>
        ({
            id: 1,
            name: 'Desserts',
            subCategories: [sub(10, 'Cakes')],
        } as RecipeCategory);

    it('returns empty patch when dto matches entity', () => {
        const entity = baseEntity();
        const dto = recipeCategoryToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('detects name change without nested changes', () => {
        const entity = baseEntity();
        const dto = recipeCategoryToUpdateDto(entity, { name: 'Sweets' });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ name: 'Sweets' });
    });

    it('patches only changed sub-category', () => {
        const entity = baseEntity();
        const subEnt = sub(10, 'Cakes');
        const dto: UpdateRecipeCategoryDto = {
            ...recipeCategoryToUpdateDto(entity),
            subCategories: [recipeSubCategoryToNestedUpdateDto(subEnt, { name: 'Layer cakes' })],
        };
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch.subCategories).toEqual([{ id: 10, name: 'Layer cakes' }]);
    });
});
