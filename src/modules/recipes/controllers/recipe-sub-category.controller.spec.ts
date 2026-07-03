import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeSubCategoryController } from './recipe-sub-category.controller';

const P = `t${Date.now()}`;

describe('recipe sub category controller', () => {
    let testingUtil: RecipeTestUtil;
    let testCtx: DatabaseTestContext;
    let controller: RecipeSubCategoryController;
    let subCategoryRepo: Repository<RecipeSubCategory>;
    let categoryRepo: Repository<RecipeCategory>;

    let categories: RecipeCategory[];
    let subCategories: RecipeSubCategory[];

    beforeAll(async () => {
        const module: TestingModule = await getRecipeTestingModule();
        testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        controller = module.get<RecipeSubCategoryController>(
            RecipeSubCategoryController,
        );
        subCategoryRepo = module.get(getRepositoryToken(RecipeSubCategory));
        categoryRepo = module.get(getRepositoryToken(RecipeCategory));

        ({ categories, subCategories } = await testingUtil.seedSubCategories(P));
    });

    afterAll(async () => {
        await subCategoryRepo.delete(subCategories.map((s) => s.id));
        await categoryRepo.delete(categories.map((c) => c.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('remove deletes a sub category then findOne fails', async () => {
        const toRemove = await subCategoryRepo.save(
            subCategoryRepo.create({
                name: `${P}-to-remove`,
                parentCategory: categories[0],
            }),
        );
        await controller.remove(toRemove.id);
        await expect(controller.findOne(toRemove.id)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
