import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import { NestedCreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/nested-create-recipe-sub-category.dto';
import { NestedUpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/nested-update-recipe-sub-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { REC_CAT_A } from '../utils/constants';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeCategoryValidator } from './recipe-category.validator';

describe('recipe category validator', () => {
    let testingUtil: RecipeTestUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: RecipeCategoryValidator;
    let categoryRepo: Repository<RecipeCategory>;

    beforeAll(async () => {
        const module: TestingModule = await getRecipeTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        await testingUtil.initRecipeSubCategoryTestingDatabase(dbTestContext);

        validator = module.get<RecipeCategoryValidator>(RecipeCategoryValidator);

        categoryRepo = module.get(getRepositoryToken(RecipeCategory));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: CreateRecipeCategoryDto = plainToInstance(CreateRecipeCategoryDto, {
            name: 'New Recipe Category',
            subCategories: [
                plainToInstance(NestedCreateRecipeSubCategoryDto, {
                    createId: 'c1',
                    name: 'Sub Category 1',
                }),
                plainToInstance(NestedCreateRecipeSubCategoryDto, {
                    createId: 'c2',
                    name: 'Sub Category 2',
                }),
            ],
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    it('fail validate create: name already exists', async () => {
        const dto: CreateRecipeCategoryDto = plainToInstance(CreateRecipeCategoryDto, {
            name: REC_CAT_A,
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
            name: 'New Recipe Category',
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
        const existingCategory = await categoryRepo.findOne({
            where: { name: REC_CAT_A },
            relations: ['subCategories'],
        });
        if (
            !existingCategory ||
            !existingCategory.subCategories ||
            existingCategory.subCategories.length === 0
        ) {
            throw new Error('existing category with subcategories not found');
        }

        const dto: CreateRecipeCategoryDto = plainToInstance(CreateRecipeCategoryDto, {
            name: 'New Recipe Category',
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
        const categoryToUpdate = await categoryRepo.findOne({
            where: { name: REC_CAT_A },
            relations: ['subCategories'],
        });
        if (!categoryToUpdate) {
            throw new Error('category not found');
        }

        const dto: UpdateRecipeCategoryDto = plainToInstance(UpdateRecipeCategoryDto, {
            name: 'Updated Recipe Category',
            subCategories:
                categoryToUpdate.subCategories &&
                    categoryToUpdate.subCategories.length > 0
                    ? [
                        plainToInstance(NestedUpdateRecipeSubCategoryDto, {
                            id: categoryToUpdate.subCategories[0].id,
                            name: 'Updated Sub Category',
                        }),
                        plainToInstance(NestedCreateRecipeSubCategoryDto, {
                            createId: 'c1',
                            name: 'New Sub Category',
                        }),
                    ]
                    : [
                        plainToInstance(NestedCreateRecipeSubCategoryDto, {
                            createId: 'c1',
                            name: 'New Sub Category',
                        }),
                    ],
        });

        const errors = await validator.validateDto(dto, categoryToUpdate.id);
        expect(errors).toBeNull();
    });

    it('fail validate update: name already exists', async () => {
        const categories = await categoryRepo.find();
        if (categories.length < 2) {
            throw new Error('Not enough categories for test');
        }

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
        const categoryToUpdate = await categoryRepo.findOne({
            where: { name: REC_CAT_A },
        });
        if (!categoryToUpdate) {
            throw new Error('category not found');
        }

        const dto: UpdateRecipeCategoryDto = plainToInstance(UpdateRecipeCategoryDto, {
            name: categoryToUpdate.name,
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

        const errors = await validator.validateDto(dto, categoryToUpdate.id);
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(
            errors,
            [],
            createValidationErrorPayload('DUPLICATE_ITEMS', ['c1', 'c2'], ['subCategories']),
        );
    });

    it('fail validate update: nested subCategories validator errors: name already exists', async () => {
        const categoryToUpdate = await categoryRepo.findOne({
            where: { name: REC_CAT_A },
            relations: ['subCategories'],
        });
        if (!categoryToUpdate) {
            throw new Error('category not found');
        }
        if (
            !categoryToUpdate.subCategories ||
            categoryToUpdate.subCategories.length === 0
        ) {
            throw new Error('subcategories not found');
        }

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
