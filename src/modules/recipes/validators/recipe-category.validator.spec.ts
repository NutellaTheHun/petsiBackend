import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateRecipeCategoryDto } from "../dto/recipe-category/create-recipe-category.dto";
import { UpdateRecipeCategoryDto } from "../dto/recipe-category/update-recipe-category.dto";
import { CreateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/create-child-recipe-sub-category.dto";
import { UpdateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/update-child-recipe-sub-category.dto copy";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { REC_CAT_A, REC_CAT_B } from "../utils/constants";
import { RecipeTestUtil } from "../utils/recipe-test.util";
import { getRecipeTestingModule } from "../utils/recipes-testing.module";
import { RecipeCategoryValidator } from "./recipe-category.validator";
import { ValidationException } from "../../../util/exceptions/validation-exception";
import { DUPLICATE, EXIST } from "../../../util/exceptions/error_constants";


describe('recipe category validator', () => {
    let testingUtil: RecipeTestUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: RecipeCategoryValidator;
    let service: RecipeCategoryService;

    beforeAll(async () => {
        const module: TestingModule = await getRecipeTestingModule();
        validator = module.get<RecipeCategoryValidator>(RecipeCategoryValidator);
        service = module.get<RecipeCategoryService>(RecipeCategoryService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
        await testingUtil.initRecipeSubCategoryTestingDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
        const subCatDtos = [
            {
                mode: 'create',
                subCategoryName: "SUB CAT 1"
            } as CreateChildRecipeSubCategoryDto,
            {
                mode: 'create',
                subCategoryName: "SUB CAT 2"
            } as CreateChildRecipeSubCategoryDto,
        ] as CreateChildRecipeSubCategoryDto[];
        const dto = {
            categoryName: "CREATE",
            subCategoryDtos: subCatDtos,
        } as CreateRecipeCategoryDto;

        await validator.validateCreate(dto);
    });

    it('should fail create: name already exists', async () => {
        const subCatDtos = [
            {
                mode: 'create',
                subCategoryName: "SUB CAT 1"
            } as CreateChildRecipeSubCategoryDto,
            {
                mode: 'create',
                subCategoryName: "SUB CAT 2"
            } as CreateChildRecipeSubCategoryDto,
        ] as CreateChildRecipeSubCategoryDto[];
        const dto = {
            categoryName: REC_CAT_A,
            subCategoryDtos: subCatDtos,
        } as CreateRecipeCategoryDto;

        try {
            await validator.validateCreate(dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(EXIST);
        }
    });

    it('should fail create: duplicate sub categories', async () => {
        const subCatDtos = [
            {
                mode: 'create',
                subCategoryName: "SUB CAT 1"
            } as CreateChildRecipeSubCategoryDto,
            {
                mode: 'create',
                subCategoryName: "SUB CAT 2"
            } as CreateChildRecipeSubCategoryDto,
            {
                mode: 'create',
                subCategoryName: "SUB CAT 1"
            } as CreateChildRecipeSubCategoryDto,
        ] as CreateChildRecipeSubCategoryDto[];
        const dto = {
            categoryName: "CREATE",
            subCategoryDtos: subCatDtos,
        } as CreateRecipeCategoryDto;

        try {
            await validator.validateCreate(dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(DUPLICATE);
        }
    });

    it('should pass update', async () => {
        const toUpdate = await service.findOneByName(REC_CAT_A, ['subCategories']);
        if (!toUpdate) { throw new Error(); }

        const subCatDtos = [
            {
                mode: 'create',
                subCategoryName: "SUB CAT 1"
            } as CreateChildRecipeSubCategoryDto,
            {
                mode: 'update',
                id: toUpdate.subCategories[0].id,
                subCategoryName: "SUB CAT 2"
            } as UpdateChildRecipeSubCategoryDto,
        ] as (CreateChildRecipeSubCategoryDto | UpdateChildRecipeSubCategoryDto)[];

        const dto = {
            categoryName: "UPDATE",
            subCategoryDtos: subCatDtos,
        } as UpdateRecipeCategoryDto;

        await validator.validateUpdate(toUpdate.id, dto);
    });

    it('should fail update: name already exists', async () => {
        const toUpdate = await service.findOneByName(REC_CAT_A, ['subCategories']);
        if (!toUpdate) { throw new Error(); }

        const subCatDtos = [
            {
                mode: 'create',
                subCategoryName: "SUB CAT 1"
            } as CreateChildRecipeSubCategoryDto,
            {
                mode: 'update',
                id: toUpdate.subCategories[0].id,
                subCategoryName: "SUB CAT 2"
            } as UpdateChildRecipeSubCategoryDto,
        ] as (CreateChildRecipeSubCategoryDto | UpdateChildRecipeSubCategoryDto)[];

        const dto = {
            categoryName: REC_CAT_B,
            subCategoryDtos: subCatDtos,
        } as UpdateRecipeCategoryDto;

        try {
            await validator.validateUpdate(toUpdate.id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(EXIST);
        }
    });

    it('should fail update: duplicate sub categories', async () => {
        const toUpdate = await service.findOneByName(REC_CAT_A, ['subCategories']);
        if (!toUpdate) { throw new Error(); }

        const subCatDtos = [
            {
                mode: 'create',
                subCategoryName: "SUB CAT 1"
            } as CreateChildRecipeSubCategoryDto,
            {
                mode: 'update',
                id: toUpdate.subCategories[0].id,
                subCategoryName: "SUB CAT 1"
            } as UpdateChildRecipeSubCategoryDto,
        ] as (CreateChildRecipeSubCategoryDto | UpdateChildRecipeSubCategoryDto)[];

        const dto = {
            categoryName: "UPDATE",
            subCategoryDtos: subCatDtos,
        } as UpdateRecipeCategoryDto;

        try {
            await validator.validateUpdate(toUpdate.id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(DUPLICATE);
        }
    });
});