import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { REC_CAT_A, REC_SUBCAT_1 } from '../utils/constants';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { RecipeSubCategoryController } from './recipe-sub-category.controller';

describe('recipe sub category controller', () => {
    let testingUtil: RecipeTestUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: RecipeSubCategoryController;
    let subRepo: Repository<RecipeSubCategory>;
    let categoryRepo: Repository<RecipeCategory>;

    beforeAll(async () => {
        module = await getRecipeTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        await testingUtil.initRecipeSubCategoryTestingDatabase(dbTestContext);

        controller = module.get<RecipeSubCategoryController>(
            RecipeSubCategoryController,
        );
        subRepo = module.get(getRepositoryToken(RecipeSubCategory));
        categoryRepo = module.get(getRepositoryToken(RecipeCategory));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await subRepo.find();
        const result = await controller.findAll();
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with sortBy name DESC matches repository ordering', async () => {
        const repoResult = await subRepo.find({ order: { name: 'DESC' } });
        const result = await controller.findAll(
            undefined,
            undefined,
            undefined,
            'name',
            'DESC',
        );
        expect(result.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(result.items[0].name).toEqual(repoResult[0].name);
        }
    });

    it('findAll with filter parentCategory matches category sub count', async () => {
        const category = await categoryRepo.findOneOrFail({
            where: { name: REC_CAT_A },
            relations: ['subCategories'],
        });
        if (!category.subCategories) throw new Error('sub categories not found');
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`parentCategory=${category.id}`],
        );
        expect(result.items.length).toEqual(category.subCategories.length);
    });

    it('findOne returns a seeded sub category', async () => {
        const sub = await subRepo.findOne({ where: { name: REC_SUBCAT_1 } });
        if (!sub) throw new Error('seed sub not found');
        const result = await controller.findOne(sub.id);
        expect(result.id).toEqual(sub.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove deletes a sub category then findOne fails', async () => {
        const rows = await subRepo.find({ take: 1 });
        if (!rows.length) throw new Error('no sub category');
        const id = rows[0].id;
        await controller.remove(id);
        await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
