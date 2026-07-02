import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import { NestedCreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/nested-create-recipe-sub-category.dto';
import { NestedUpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/nested-update-recipe-sub-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeCategoryService } from './recipe-category.service';

class TestableRecipeCategoryService extends RecipeCategoryService {
    async createEntityForTest(
        dto: CreateRecipeCategoryDto,
        manager: EntityManager,
    ): Promise<RecipeCategory> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateRecipeCategoryDto,
        entity: RecipeCategory,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('recipe category service', () => {
    let categoryService: TestableRecipeCategoryService;
    let testUtil: RecipeTestUtil;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;

    let categoryRepo: Repository<RecipeCategory>;
    let subCategoryRepo: Repository<RecipeSubCategory>;

    let categories: RecipeCategory[];
    let subCategories: RecipeSubCategory[];

    beforeAll(async () => {
        const module: TestingModule = await getRecipeTestingModule({
            recipeCategoryServiceClass: TestableRecipeCategoryService,
        });

        testUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        categoryService = module.get(
            RecipeCategoryService,
        ) as TestableRecipeCategoryService;
        categoryRepo = module.get(getRepositoryToken(RecipeCategory));
        subCategoryRepo = module.get(getRepositoryToken(RecipeSubCategory));
        dataSource = module.get(DataSource);

        ({ categories, subCategories } = await testUtil.seedSubCategories(P));
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

    describe('category lifecycle', () => {
        let category: RecipeCategory;

        it('should create category', async () => {
            const dto = plainToInstance(CreateRecipeCategoryDto, {
                name: `${P}-lifecycle-category`,
            });
            await dataSource.transaction(async (manager) => {
                category = await categoryService.createEntityForTest(dto, manager);
            });
            expect(category.id).toBeDefined();
            expect(category.name).toEqual(dto.name);
        });

        it('should update category', async () => {
            const dto = plainToInstance(UpdateRecipeCategoryDto, {
                name: `${P}-lifecycle-category-updated`,
            });
            await dataSource.transaction(async (manager) => {
                await categoryService.updateEntityForTest(dto, category, manager);
            });
            const reloaded = await categoryRepo.findOneOrFail({
                where: { id: category.id },
            });
            expect(reloaded.name).toEqual(`${P}-lifecycle-category-updated`);
        });

        it('should remove category', async () => {
            await categoryService.remove(category.id);
            await expect(categoryService.findOne(category.id)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    it('should create category with NestedCreateRecipeSubCategoryDtos', async () => {
        const dto = plainToInstance(CreateRecipeCategoryDto, {
            name: `${P}-category-with-subs`,
            subCategories: [
                plainToInstance(NestedCreateRecipeSubCategoryDto, {
                    createId: 'c1',
                    name: `${P}-nested-sub-a`,
                }),
                plainToInstance(NestedCreateRecipeSubCategoryDto, {
                    createId: 'c2',
                    name: `${P}-nested-sub-b`,
                }),
            ],
        });

        let created!: RecipeCategory;
        await dataSource.transaction(async (manager) => {
            created = await categoryService.createEntityForTest(dto, manager);
        });
        testCtx.addCleanupFunction(async () => {
            await categoryRepo.delete(created.id);
        });

        expect(created.subCategories?.length).toBe(2);
        expect(created.subCategories?.map((s) => s.name).sort()).toEqual([
            `${P}-nested-sub-a`,
            `${P}-nested-sub-b`,
        ]);
    });

    it('should update category with NestedUpdateRecipeSubCategoryDto and NestedCreateRecipeSubCategoryDto', async () => {
        const cat = await categoryRepo.findOneOrFail({
            where: { id: categories[0].id },
            relations: ['subCategories'],
        });
        const existing = cat.subCategories[0];

        const dto = plainToInstance(UpdateRecipeCategoryDto, {
            subCategories: [
                plainToInstance(NestedUpdateRecipeSubCategoryDto, {
                    id: existing.id,
                    name: `${P}-updated-sub`,
                }),
                plainToInstance(NestedCreateRecipeSubCategoryDto, {
                    createId: 'c2',
                    name: `${P}-new-sub`,
                }),
            ],
        });

        await dataSource.transaction(async (manager) => {
            await categoryService.updateEntityForTest(dto, cat, manager);
        });

        const updated = await categoryRepo.findOneOrFail({
            where: { id: cat.id },
            relations: ['subCategories'],
        });
        const updatedSub = updated.subCategories.find((s) => s.id === existing.id);
        expect(updatedSub?.name).toEqual(`${P}-updated-sub`);
        const newSub = updated.subCategories.find(
            (s) => s.name === `${P}-new-sub`,
        );
        expect(newSub).toBeDefined();
        testCtx.addCleanupFunction(async () => {
            if (newSub) {
                await subCategoryRepo.delete(newSub.id);
            }
        });
    });

    it('should find seeded category in findAll results', async () => {
        const result = await categoryService.findAll({ limit: 100 });
        const found = result.items.find((c) => c.id === categories[0].id);
        expect(found).toBeDefined();
    });

    it('should find one category with relations', async () => {
        const result = await categoryService.findOne(categories[0].id, [
            'subCategories',
            'recipes',
        ]);
        expect(result.id).toEqual(categories[0].id);
        expect(Array.isArray(result.subCategories)).toBe(true);
        expect(Array.isArray(result.recipes)).toBe(true);
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(categoryService.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(RecipeCategoryService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when DTO matches entity', async () => {
            const category = await categoryRepo.findOneOrFail({
                where: { id: categories[2].id },
                relations: ['subCategories'],
            });
            const dto = plainToInstance(UpdateRecipeCategoryDto, {
                name: category.name,
            });
            const result = await categoryService.update(category.id, dto);
            expect(result.name).toEqual(category.name);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const category = await categoryRepo.findOneOrFail({
                where: { id: categories[2].id },
                relations: ['subCategories'],
            });
            const dto = plainToInstance(UpdateRecipeCategoryDto, {
                name: `${P}-category-renamed`,
            });
            await categoryService.update(category.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await categoryRepo.findOneOrFail({ where: { id: category.id } });
            expect(row.name).toEqual(`${P}-category-renamed`);
        });
    });
});
