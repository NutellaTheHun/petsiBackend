import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/create-child-recipe-sub-category.dto";
import { UpdateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/update-child-recipe-sub-category.dto copy";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";
import { REC_SUBCAT_1, REC_SUBCAT_2, REC_SUBCAT_3 } from "../utils/constants";
import { RecipeTestUtil } from "../utils/recipe-test.util";
import { getRecipeTestingModule } from "../utils/recipes-testing.module";
import { RecipeSubCategoryValidator } from "./recipe-sub-category.validator";

describe('recipe sub category validator', () => {
    let testingUtil: RecipeTestUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: RecipeSubCategoryValidator;
    let service: RecipeSubCategoryService;

    beforeAll(async () => {
        const module: TestingModule = await getRecipeTestingModule();
        validator = module.get<RecipeSubCategoryValidator>(RecipeSubCategoryValidator);
        service = module.get<RecipeSubCategoryService>(RecipeSubCategoryService);

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
        const dto = {
            mode: 'create',
            subCategoryName: "CREATE"
        } as CreateChildRecipeSubCategoryDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create: name already exists', async () => {
        const dto = {
            mode: 'create',
            subCategoryName: REC_SUBCAT_3
        } as CreateChildRecipeSubCategoryDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`sub category with name ${REC_SUBCAT_3} already exists`);
    });


    it('should pass update', async () => {
        const toUpdate = await service.findOneByName(REC_SUBCAT_1);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            mode: 'update',
            subCategoryName: "UPDATE",
        } as UpdateChildRecipeSubCategoryDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update: name already exists', async () => {
        const toUpdate = await service.findOneByName(REC_SUBCAT_1);
        if (!toUpdate) { throw new Error(); }

        const dto = {
            mode: 'update',
            subCategoryName: REC_SUBCAT_2,
        } as UpdateChildRecipeSubCategoryDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`sub category with name ${REC_SUBCAT_2} already exists`);
    });
});