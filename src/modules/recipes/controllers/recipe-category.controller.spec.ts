import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { DatabaseException } from '../../../common/exceptions/database-exception';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeCategoryService } from '../services/recipe-category.service';
import { REC_CAT_A, REC_CAT_C } from '../utils/constants';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { RecipeCategoryController } from './recipe-category.controller';

describe('recipe category controller', () => {
    let testingUtil: RecipeTestUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: RecipeCategoryController;
    let categoryRepo: Repository<RecipeCategory>;

    beforeAll(async () => {
        module = await getRecipeTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        await testingUtil.initRecipeCategoryTestingDatabase(dbTestContext);
        await testingUtil.initRecipeSubCategoryTestingDatabase(dbTestContext);
        await testingUtil.initRecipeTestingDatabase(dbTestContext);
        await testingUtil.initRecipeIngredientTestingDatabase(dbTestContext);

        controller = module.get<RecipeCategoryController>(
            RecipeCategoryController,
        );
        categoryRepo = module.get(getRepositoryToken(RecipeCategory));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await categoryRepo.find();
        const result = await controller.findAll(undefined, 100);
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with sortBy name DESC matches repository ordering', async () => {
        const repoResult = await categoryRepo.find({ order: { name: 'DESC' } });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            'name',
            'DESC',
        );
        expect(result.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(result.items[0].name).toEqual(repoResult[0].name);
        }
    });

    it('findOne returns a seeded category', async () => {
        const cat = await categoryRepo.findOne({ where: { name: REC_CAT_A } });
        if (!cat) throw new Error('seed category not found');
        const result = await controller.findOne(cat.id);
        expect(result.id).toEqual(cat.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists a new recipe category', async () => {
        const dto = plainToInstance(CreateRecipeCategoryDto, {
            name: 'ControllerRecipeCategoryNew',
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        const row = await categoryRepo.findOne({ where: { name: dto.name } });
        expect(row).not.toBeNull();
    });

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateRecipeCategoryDto, {
            name: REC_CAT_A,
        });
        try {
            await controller.create(dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
            );
        }
    });

    it('update throws ValidationException when name collides with another category', async () => {
        const categories = await categoryRepo.find();
        if (categories.length < 2) throw new Error('Not enough categories');

        const categoryToUpdate = categories[0];
        const existingCategory = categories[1];
        const dto = plainToInstance(UpdateRecipeCategoryDto, {
            name: existingCategory.name,
        });
        try {
            await controller.update(categoryToUpdate.id, dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
            );
        }
    });

    it('update surfaces missing entity via DatabaseException', async () => {
        const dto = plainToInstance(UpdateRecipeCategoryDto, {
            name: 'DoesNotMatter',
        });
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            DatabaseException,
        );
    });

    it('calls updateEntity when name changes', async () => {
        const updateEntitySpy = jest.spyOn(
            RecipeCategoryService.prototype as any,
            'updateEntity',
        );
        try {
            const cat = await categoryRepo.findOne({ where: { name: REC_CAT_C } });
            if (!cat) throw new Error('rec cat c not found');
            const newName = 'recipeCategory_C renamed ctrl';
            const result = await controller.update(
                cat.id,
                plainToInstance(UpdateRecipeCategoryDto, { name: newName }),
            );
            expect(result.name).toEqual(newName);
            expect(updateEntitySpy).toHaveBeenCalled();
            const row = await categoryRepo.findOne({ where: { id: cat.id } });
            expect(row!.name).toEqual(newName);
        } finally {
            updateEntitySpy.mockRestore();
        }
    });

    it('remove deletes a created category then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateRecipeCategoryDto, {
                name: 'ControllerRecipeCategoryRemove',
            }),
        );
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('remove throws NotFoundException when id does not exist', async () => {
        await expect(controller.remove(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });
});
