import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import { NestedCreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/nested-create-recipe-sub-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeCategoryValidator } from './recipe-category.validator';

const P = `t${Date.now()}`;

describe('recipe category validator', () => {
    let testingUtil: RecipeTestUtil;
    let testCtx: DatabaseTestContext;

    let validator: RecipeCategoryValidator;
    let categoryRepo: Repository<RecipeCategory>;
    let subCategoryRepo: Repository<RecipeSubCategory>;

    let categories: RecipeCategory[];
    let subCategories: RecipeSubCategory[];

    beforeAll(async () => {
        const module: TestingModule = await getRecipeTestingModule();
        testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        validator = module.get<RecipeCategoryValidator>(RecipeCategoryValidator);
        categoryRepo = module.get(getRepositoryToken(RecipeCategory));
        subCategoryRepo = module.get(getRepositoryToken(RecipeSubCategory));

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

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: CreateRecipeCategoryDto = plainToInstance(CreateRecipeCategoryDto, {
            name: `${P}-new-category`,
            subCategories: [
                plainToInstance(NestedCreateRecipeSubCategoryDto, {
                    createId: 'c1',
                    name: `${P}-new-sub-1`,
                }),
                plainToInstance(NestedCreateRecipeSubCategoryDto, {
                    createId: 'c2',
                    name: `${P}-new-sub-2`,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateRecipeCategoryDto = plainToInstance(CreateRecipeCategoryDto, {
            name: categories[0].name,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate create: duplicate sub categories', async () => {
        const dto: CreateRecipeCategoryDto = plainToInstance(CreateRecipeCategoryDto, {
            name: `${P}-new-category-2`,
            subCategories: [
                plainToInstance(NestedCreateRecipeSubCategoryDto, {
                    createId: 'c1',
                    name: 'Duplicate Name',
                }),
                plainToInstance(NestedCreateRecipeSubCategoryDto, {
                    createId: 'c2',
                    name: 'Duplicate Name',
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['subCategories']),
        );
    });

    it('successfully validate create: subCategory name may match other categories', async () => {
        const existingCategory = await categoryRepo.findOneOrFail({
            where: { id: categories[0].id },
            relations: ['subCategories'],
        });

        const dto: CreateRecipeCategoryDto = plainToInstance(CreateRecipeCategoryDto, {
            name: `${P}-new-category-3`,
            subCategories: [
                plainToInstance(NestedCreateRecipeSubCategoryDto, {
                    createId: 'c1',
                    name: existingCategory.subCategories[0].name,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const categoryToUpdate = await categoryRepo.findOneOrFail({
            where: { id: categories[0].id },
            relations: ['subCategories'],
        });

        const dto: UpdateRecipeCategoryDto = plainToInstance(UpdateRecipeCategoryDto, {
            name: `${P}-updated-category`,
            subCategories: [
                plainToInstance(NestedCreateRecipeSubCategoryDto, {
                    createId: 'c1',
                    name: `${P}-updated-new-sub`,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, categoryToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const categoryToUpdate = categories[0];
        const existingCategory = categories[1];

        const dto: UpdateRecipeCategoryDto = plainToInstance(UpdateRecipeCategoryDto, {
            name: existingCategory.name,
            subCategories: [],
        });

        const errors = await validator.validateDto(dto, categoryToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate update: duplicate sub categories', async () => {
        const categoryToUpdate = categories[0];

        const dto: UpdateRecipeCategoryDto = plainToInstance(UpdateRecipeCategoryDto, {
            name: categoryToUpdate.name,
            subCategories: [
                plainToInstance(NestedCreateRecipeSubCategoryDto, {
                    createId: 'c1',
                    name: 'Duplicate Update Name',
                }),
                plainToInstance(NestedCreateRecipeSubCategoryDto, {
                    createId: 'c2',
                    name: 'Duplicate Update Name',
                }),
            ],
        });

        const errors = await validator.validateDto(dto, categoryToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['subCategories']),
        );
    });

    it('fail validate update: nested subCategories validator errors: name already exists', async () => {
        const categoryToUpdate = await categoryRepo.findOneOrFail({
            where: { id: categories[0].id },
            relations: ['subCategories'],
        });
        const existingSubCategory = categoryToUpdate.subCategories[0];

        const dto: UpdateRecipeCategoryDto = plainToInstance(UpdateRecipeCategoryDto, {
            name: categoryToUpdate.name,
            subCategories: [
                plainToInstance(NestedCreateRecipeSubCategoryDto, {
                    createId: 'c1',
                    name: existingSubCategory.name,
                }),
            ],
        });

        const errors = await validator.validateDto(dto, categoryToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expect(errors).not.toBeNull();
    });
});
