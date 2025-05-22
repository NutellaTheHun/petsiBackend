import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { RecipeTestUtil } from "../utils/recipe-test.util";
import { getRecipeTestingModule } from "../utils/recipes-testing.module";
import { RecipeCategoryValidator } from "./recipe-category.validator";
import { CreateRecipeCategoryDto } from "../dto/recipe-category/create-recipe-category.dto";
import { UpdateRecipeCategoryDto } from "../dto/recipe-category/update-recipe-category.dto";
import { CreateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/create-child-recipe-sub-category.dto";
import { REC_CAT_A, REC_CAT_B } from "../utils/constants";
import { UpdateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/update-child-recipe-sub-category.dto copy";


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

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
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

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`Recipe category with name ${REC_CAT_A} already exists`);
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

        const result = await validator.validateCreate(dto);

        expect(result).toEqual('category has duplicate subcategories (same name)');
    });

    it('should pass update', async () => {
        const toUpdate = await service.findOneByName(REC_CAT_A, ['subCategories']);
        if(!toUpdate){ throw new Error(); }

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

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update: name already exists', async () => {
        const toUpdate = await service.findOneByName(REC_CAT_A, ['subCategories']);
        if(!toUpdate){ throw new Error(); }

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

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Recipe category with name ${REC_CAT_B} already exists`);
    });

    it('should fail update: duplicate sub categories', async () => {
        const toUpdate = await service.findOneByName(REC_CAT_A, ['subCategories']);
        if(!toUpdate){ throw new Error(); }

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

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual('category has duplicate subcategories (same name)');
    });
});