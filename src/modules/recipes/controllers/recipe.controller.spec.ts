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
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { OUNCE, POUND } from '../../unit-of-measure/utils/constants';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe } from '../entities/recipe.entity';
import { RecipeService } from '../services/recipe.service';
import { REC_A } from '../utils/constants';
import { recipeToUpdateDto } from '../utils/entity-transformers/recipe.dto.transformer';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { RecipeController } from './recipe.controller';

const ING_SEARCH_RELATIONS = [
    'ingredients',
    'ingredients.ingredientInventoryItem',
    'ingredients.ingredientRecipe',
] as const;

describe('recipe controller', () => {
    let testingUtil: RecipeTestUtil;
    let dbTestContext: DatabaseTestContext;
    let module: TestingModule;
    let controller: RecipeController;
    let recipeRepo: Repository<Recipe>;
    let categoryRepo: Repository<RecipeCategory>;
    let subCategoryRepo: Repository<RecipeSubCategory>;
    let unitOfMeasureRepo: Repository<UnitOfMeasure>;
    let menuItemTestUtil: MenuItemTestingUtil;

    beforeAll(async () => {
        module = await getRecipeTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        await testingUtil.initRecipeIngredientTestingDatabase(dbTestContext);
        menuItemTestUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await menuItemTestUtil.initMenuItemTestDatabase(dbTestContext);

        controller = module.get<RecipeController>(RecipeController);
        recipeRepo = module.get(getRepositoryToken(Recipe));
        categoryRepo = module.get(getRepositoryToken(RecipeCategory));
        subCategoryRepo = module.get(getRepositoryToken(RecipeSubCategory));
        unitOfMeasureRepo = module.get(getRepositoryToken(UnitOfMeasure));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    async function loadRecipeForUpdate(): Promise<Recipe> {
        return recipeRepo.findOneOrFail({
            where: {},
            relations: [
                'category',
                'subCategory',
                'producedMenuItem',
                'batchResultUnitType',
                'servingSizeUnitType',
                'ingredients',
                'ingredients.quantityUnitType',
                'ingredients.ingredientInventoryItem',
                'ingredients.ingredientRecipe',
            ],
        });
    }

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll returns items aligned with repository', async () => {
        const repoRows = await recipeRepo.find();
        const result = await controller.findAll(undefined, 100);
        expect(result.items.length).toEqual(repoRows.length);
    });

    it('findAll with search by recipe name', async () => {
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            'recipe',
            undefined,
        );
        expect(result.items.length).toBeGreaterThan(0);
        expect(
            result.items.every((r) => r.name.toLowerCase().includes('recipe')),
        ).toBe(true);
    });

    it('findAll with search by ingredient matches service ids', async () => {
        const recipeService = module.get(RecipeService);
        const rels = [...ING_SEARCH_RELATIONS];
        const svcResult = await recipeService.findAll({
            search: 'food',
            limit: 100,
            relations: rels as string[],
        });
        const ctrlResult = await controller.findAll(
            rels,
            100,
            undefined,
            undefined,
            undefined,
            'food',
            undefined,
        );
        expect(ctrlResult.items.length).toEqual(svcResult?.items.length ?? 0);
        const svcIds = (svcResult?.items ?? []).map((r) => r.id).sort((a, b) => a - b);
        const ctrlIds = ctrlResult.items.map((r) => r.id).sort((a, b) => a - b);
        expect(ctrlIds).toEqual(svcIds);
    });

    it('findAll with filter by category matches repository', async () => {
        const [cat] = await categoryRepo.find({ take: 1 });
        if (!cat) throw new Error('category not found');
        const repoResult = await recipeRepo.find({
            where: { category: { id: cat.id } },
        });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`category=${cat.id}`],
        );
        expect(result.items.length).toEqual(repoResult.length);
    });

    it('findAll with filter by subCategory matches repository', async () => {
        const [sub] = await subCategoryRepo.find({ take: 1 });
        if (!sub) throw new Error('sub category not found');
        const repoResult = await recipeRepo.find({
            where: { subCategory: { id: sub.id } },
        });
        const result = await controller.findAll(
            undefined,
            100,
            undefined,
            undefined,
            undefined,
            undefined,
            [`subCategory=${sub.id}`],
        );
        expect(result.items.length).toEqual(repoResult.length);
    });

    it('findOne returns a seeded recipe', async () => {
        const [r] = await recipeRepo.find({ take: 1 });
        if (!r) throw new Error('recipe not found');
        const result = await controller.findOne(r.id);
        expect(result.id).toEqual(r.id);
    });

    it('findOne throws NotFoundException for missing id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create persists a new recipe', async () => {
        const batchUom = await unitOfMeasureRepo.findOne({ where: { name: POUND } });
        const servingUom = await unitOfMeasureRepo.findOne({ where: { name: OUNCE } });
        if (!batchUom || !servingUom) throw new Error('uom not found');

        const dto = plainToInstance(CreateRecipeDto, {
            name: 'Controller Recipe Create',
            batchResultQuantity: 5,
            batchResultUnitTypeId: batchUom.id,
            servingSizeQuantity: 2,
            servingSizeUnitTypeId: servingUom.id,
            isIngredient: false,
            ingredients: [],
        });
        const result = await controller.create(dto);
        expect(result.id).toBeDefined();
        const row = await recipeRepo.findOne({ where: { name: dto.name } });
        expect(row).not.toBeNull();
    });

    it('create throws ValidationException when name already exists', async () => {
        const batchUom = await unitOfMeasureRepo.findOne({ where: { name: POUND } });
        const servingUom = await unitOfMeasureRepo.findOne({ where: { name: OUNCE } });
        if (!batchUom || !servingUom) throw new Error('uom not found');

        const dto = plainToInstance(CreateRecipeDto, {
            name: REC_A,
            batchResultQuantity: 5,
            batchResultUnitTypeId: batchUom.id,
            servingSizeQuantity: 2,
            servingSizeUnitTypeId: servingUom.id,
            isIngredient: false,
            ingredients: [],
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

    it('update surfaces missing entity via DatabaseException', async () => {
        const dto = plainToInstance(UpdateRecipeDto, { name: 'DoesNotMatter' });
        await expect(controller.update(9_999_999, dto)).rejects.toThrow(
            DatabaseException,
        );
    });

    it('calls updateEntity when name changes', async () => {
        const updateEntitySpy = jest.spyOn(
            RecipeService.prototype as any,
            'updateEntity',
        );
        try {
            const recipe = await loadRecipeForUpdate();
            const newName = `${recipe.name} ctrl renamed`;
            const dto = recipeToUpdateDto(recipe, { name: newName });
            const result = await controller.update(recipe.id, dto);
            expect(result.name).toEqual(newName);
            expect(updateEntitySpy).toHaveBeenCalled();
            const row = await recipeRepo.findOne({ where: { id: recipe.id } });
            expect(row!.name).toEqual(newName);
        } finally {
            updateEntitySpy.mockRestore();
        }
    });

    it('remove deletes a created recipe then findOne fails', async () => {
        const batchUom = await unitOfMeasureRepo.findOne({ where: { name: POUND } });
        const servingUom = await unitOfMeasureRepo.findOne({ where: { name: OUNCE } });
        if (!batchUom || !servingUom) throw new Error('uom not found');

        const created = await controller.create(
            plainToInstance(CreateRecipeDto, {
                name: 'Controller Recipe Remove',
                batchResultQuantity: 1,
                batchResultUnitTypeId: batchUom.id,
                servingSizeQuantity: 1,
                servingSizeUnitTypeId: servingUom.id,
                isIngredient: false,
                ingredients: [],
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
