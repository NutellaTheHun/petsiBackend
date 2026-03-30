import { RecipeSubCategory } from '../../entities/recipe-sub-category.entity';
import {
    recipeSubCategoryToNestedUpdateDto,
    recipeSubCategoryToUpdateDto,
} from '../entity-transformers/recipe-sub-category.dto.transformer';
import { RecipeSubCategoryChangeDetector } from './recipe-sub-category.change-detector';

describe('RecipeSubCategoryChangeDetector', () => {
    const detector = new RecipeSubCategoryChangeDetector();

    const baseEntity = (): RecipeSubCategory => ({ id: 1, name: 'Pies' } as RecipeSubCategory);

    it('returns empty patch for UpdateDto when dto matches entity', () => {
        const entity = baseEntity();
        const dto = recipeSubCategoryToUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({});
    });

    it('returns empty patch for NestedUpdateDto when dto matches entity', () => {
        const entity = baseEntity();
        const dto = recipeSubCategoryToNestedUpdateDto(entity);
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(false);
        expect(result.patch).toEqual({ id: 1 });
    });

    it('detects name change', () => {
        const entity = baseEntity();
        const dto = recipeSubCategoryToNestedUpdateDto(entity, { name: 'Tarts' });
        const result = detector.detect(entity, dto);
        expect(result.hasChanges).toBe(true);
        expect(result.patch).toEqual({ id: 1, name: 'Tarts' });
    });
});
