import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeSubCategoryValidator } from './recipe-sub-category.validator';

const P = `t${Date.now()}`;

describe('recipe sub category validator', () => {
    let testingUtil: RecipeTestUtil;
    let testCtx: DatabaseTestContext;

    let validator: RecipeSubCategoryValidator;
    let subCategoryRepo: Repository<RecipeSubCategory>;
    let categoryRepo: Repository<RecipeCategory>;

    let categories: RecipeCategory[];
    let subCategories: RecipeSubCategory[];

    beforeAll(async () => {
        const module: TestingModule = await getRecipeTestingModule();
        testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        validator = module.get<RecipeSubCategoryValidator>(RecipeSubCategoryValidator);
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

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: CreateRecipeSubCategoryDto = plainToInstance(CreateRecipeSubCategoryDto, {
            name: `${P}-new-sub-category`,
            parentCategoryId: categories[0].id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists within parent category', async () => {
        const parentCategory = await categoryRepo.findOneOrFail({
            where: { id: categories[0].id },
            relations: ['subCategories'],
        });

        const dto: CreateRecipeSubCategoryDto = plainToInstance(CreateRecipeSubCategoryDto, {
            name: parentCategory.subCategories[0].name,
            parentCategoryId: parentCategory.id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate create: name cannot be the same as the parent category name', async () => {
        const parentCategory = categories[0];

        const dto: CreateRecipeSubCategoryDto = plainToInstance(CreateRecipeSubCategoryDto, {
            name: parentCategory.name,
            parentCategoryId: parentCategory.id,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['name']),
        );
    });

    // Update Validation Tests
    it('successfully validate update: no validation errors', async () => {
        const subCategoryToUpdate = subCategories[0];

        const dto: UpdateRecipeSubCategoryDto = plainToInstance(UpdateRecipeSubCategoryDto, {
            name: `${P}-updated-sub-category-name`,
        });

        const errors = await validator.validateDto(dto, subCategoryToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists within parent category', async () => {
        const subCategoryToUpdate = subCategories[0];
        const existingSubCategory = subCategories[1];

        const dto: UpdateRecipeSubCategoryDto = plainToInstance(UpdateRecipeSubCategoryDto, {
            name: existingSubCategory.name,
        });

        const errors = await validator.validateDto(dto, subCategoryToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
        );
    });

    it('fail validate update: name cannot be the same as the parent category name', async () => {
        const subCategoryToUpdate = subCategories[0];
        const parentCategory = categories[0];

        const dto: UpdateRecipeSubCategoryDto = plainToInstance(UpdateRecipeSubCategoryDto, {
            name: parentCategory.name,
        });

        const errors = await validator.validateDto(dto, subCategoryToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['name']),
        );
    });
});
