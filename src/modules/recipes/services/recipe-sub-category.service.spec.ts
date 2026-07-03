import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeSubCategoryService } from './recipe-sub-category.service';

class TestableRecipeSubCategoryService extends RecipeSubCategoryService {
    async createEntityForTest(
        dto: CreateRecipeSubCategoryDto,
        manager: EntityManager,
    ): Promise<RecipeSubCategory> {
        return this.createEntity(dto, manager);
    }

    async updateEntityForTest(
        dto: UpdateRecipeSubCategoryDto,
        entity: RecipeSubCategory,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('recipe sub category service', () => {
    let subCategoryService: TestableRecipeSubCategoryService;
    let testingUtil: RecipeTestUtil;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;

    let subCategoryRepo: Repository<RecipeSubCategory>;
    let categoryRepo: Repository<RecipeCategory>;

    let categories: RecipeCategory[];
    let subCategories: RecipeSubCategory[];

    beforeAll(async () => {
        const module: TestingModule = await getRecipeTestingModule({
            recipeSubCategoryServiceClass: TestableRecipeSubCategoryService,
        });
        testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        subCategoryService = module.get<RecipeSubCategoryService>(
            RecipeSubCategoryService,
        ) as TestableRecipeSubCategoryService;
        subCategoryRepo = module.get(getRepositoryToken(RecipeSubCategory));
        categoryRepo = module.get(getRepositoryToken(RecipeCategory));
        dataSource = module.get(DataSource);

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

    describe('sub category lifecycle', () => {
        let subCategory: RecipeSubCategory;

        it('should create recipe sub category', async () => {
            const dto = plainToInstance(CreateRecipeSubCategoryDto, {
                name: `${P}-lifecycle-sub`,
                parentCategoryId: categories[0].id,
            });

            await dataSource.transaction(async (manager) => {
                subCategory = await subCategoryService.createEntityForTest(dto, manager);
            });
            expect(subCategory.id).toBeDefined();
            expect(subCategory.name).toEqual(dto.name);
        });

        it('should update recipe sub category', async () => {
            const dto = plainToInstance(UpdateRecipeSubCategoryDto, {
                name: `${P}-lifecycle-sub-updated`,
            });

            await dataSource.transaction(async (manager) => {
                await subCategoryService.updateEntityForTest(dto, subCategory, manager);
            });

            const result = await subCategoryRepo.findOneOrFail({
                where: { id: subCategory.id },
            });
            expect(result.name).toEqual(dto.name);
        });

        it('should remove recipe sub category', async () => {
            await subCategoryService.remove(subCategory.id);
            await expect(subCategoryService.findOne(subCategory.id)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    it('should find seeded sub category in findAll results', async () => {
        const result = await subCategoryService.findAll({ limit: 100 });
        const found = result.items.find((s) => s.id === subCategories[0].id);
        expect(found).toBeDefined();
    });

    it('should find all recipe sub categories with filter by category', async () => {
        const result = await subCategoryService.findAll({
            filters: [`parentCategory=${categories[0].id}`],
            relations: ['parentCategory'],
            limit: 100,
        });
        const foundIds = result.items.map((s) => s.id);
        expect(foundIds).toEqual(
            expect.arrayContaining([subCategories[0].id, subCategories[1].id]),
        );
        expect(
            result.items.every((s) => s.parentCategory?.id === categories[0].id),
        ).toBe(true);
    });

    it('should find one recipe sub category with relations', async () => {
        const result = await subCategoryService.findOne(subCategories[0].id, [
            'parentCategory',
            'recipes',
        ]);
        expect(result.id).toEqual(subCategories[0].id);
        expect(result.parentCategory).toBeDefined();
        expect(Array.isArray(result.recipes)).toBe(true);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(subCategoryService.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(
                RecipeSubCategoryService.prototype as any,
                'updateEntity',
            );
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when DTO matches entity', async () => {
            const subCategory = await subCategoryRepo.findOneOrFail({
                where: { id: subCategories[2].id },
            });
            const dto = plainToInstance(UpdateRecipeSubCategoryDto, {
                name: subCategory.name,
            });
            const result = await subCategoryService.update(subCategory.id, dto);
            expect(result.name).toEqual(subCategory.name);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const subCategory = await subCategoryRepo.findOneOrFail({
                where: { id: subCategories[2].id },
            });
            const dto = plainToInstance(UpdateRecipeSubCategoryDto, {
                name: `${P}-sub-renamed`,
            });
            await subCategoryService.update(subCategory.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await subCategoryRepo.findOneOrFail({ where: { id: subCategory.id } });
            expect(row.name).toEqual(`${P}-sub-renamed`);
        });
    });
});
