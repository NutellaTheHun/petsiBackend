import { TestingModule } from '@nestjs/testing';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeService } from './recipe.service';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { CreateRecipeDto } from '../dto/create-recipe.dto';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import { GRAM, KILOGRAM, OUNCE, POUND } from '../../unit-of-measure/utils/constants';
import { RecipeCategoryService } from './recipe-category.service';
import { RecipeSubCategoryService } from './recipe-sub-category.service';
import { REC_A, REC_CAT_A, REC_CAT_NONE, REC_SUBCAT_NONE } from '../utils/constants';
import { UpdateRecipeDto } from '../dto/update-recipe-dto';

describe('recipe service', () => {
  let recipeService: RecipeService;
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;

  let categoryService: RecipeCategoryService;
  let subCategoryService: RecipeSubCategoryService;

  let unitOfMeasureService: UnitOfMeasureService;

  let testId: number;
  let testIds: number[];
  
  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initRecipeTestingDatabase(dbTestContext);

    recipeService = module.get<RecipeService>(RecipeService);
    categoryService = module.get<RecipeCategoryService>(RecipeCategoryService);
    subCategoryService = module.get<RecipeSubCategoryService>(RecipeSubCategoryService);

    unitOfMeasureService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(recipeService).toBeDefined();
  });

  it('should create a recipe', async () => {
    const batchUnit = await unitOfMeasureService.findOneByName(POUND);
    if(!batchUnit){ throw new Error("unit of measure POUND not found"); }
    const servingUnit = await unitOfMeasureService.findOneByName(OUNCE);
    if(!servingUnit){ throw new Error("unit of measure OUNCE not found"); }

    const recName = "testRecipe";
    const batchAmount = 1;
    const servingAmonut = 2;
    const salesAmount = 10.99;
    const costAmount = 5.99

    const dto = {
      name: recName,
      batchResultQuantity: batchAmount,
      batchResultUnitOfMeasureId: batchUnit.id,
      servingSizeQuantity: servingAmonut,
      servingSizeUnitOfMeasureId: servingUnit.id,
      salesPrice: salesAmount,
      cost: costAmount,
      //default is no category
      //default is no sub-category
    } as CreateRecipeDto;

    const result = await recipeService.create(dto);

    const noCategory = await categoryService.findOneByName(REC_CAT_NONE);
    if(!noCategory){ throw new Error("category NONE not found."); }
    const noSubCategory = await subCategoryService.findOneByName(REC_SUBCAT_NONE);
    if(!noSubCategory){ throw new Error("sub-category NONE not found"); }

    expect(result).not.toBeNull();
    expect(result?.name).toEqual(recName)
    expect(result?.batchResultQuantity).toEqual(batchAmount);
    expect(result?.batchResultUnitOfMeasure?.id).toEqual(batchUnit.id);
    expect(result?.servingSizeQuantity).toEqual(servingAmonut);
    expect(result?.servingSizeUnitOfMeasure?.id).toEqual(servingUnit.id);
    expect(result?.salesPrice).toEqual(salesAmount);
    expect(result?.cost).toEqual(costAmount);
    expect(result?.category?.id).toEqual(noCategory.id);
    expect(result?.subCategory?.id).toEqual(noSubCategory.id);

    testId = result?.id as number;
  });

  it('should update a recipe', async () => {
    const toUpdate = await recipeService.findOne(testId, ["category", "subCategory"]);
    if(!toUpdate){ throw new Error("recipe to update is null"); }
    if(!toUpdate.category){ throw new Error("recipe category is null"); }
    if(!toUpdate.subCategory){ throw new Error("recipe sub-category is null"); }

    const updateBatchUnit = await unitOfMeasureService.findOneByName(KILOGRAM);
    if(!updateBatchUnit){ throw new Error("unit of measure POUND not found"); }
    const updateServingUnit = await unitOfMeasureService.findOneByName(GRAM);
    if(!updateServingUnit){ throw new Error("unit of measure OUNCE not found"); }

    const updateName = "UPDATED testRecipe";
    const updateBatchAmount = 2;
    const updateServingAmonut = 4;
    const updateSalesAmount = 14.99;
    const updateCostAmount = 8.99;

    const updatedCategory = await categoryService.findOneByName(REC_CAT_A, ["subCategories"]);
    if(!updatedCategory){ throw new Error("category A for update is null"); }
    if(!updatedCategory.subCategories){ throw new Error("category A's subCategories for update is null"); }

    const updatedSubCategory = updatedCategory.subCategories[0];

    const dto = {
      name: updateName,
      batchResultQuantity: updateBatchAmount,
      batchResultUnitOfMeasureId: updateBatchUnit.id,
      servingSizeQuantity: updateServingAmonut,
      servingSizeUnitOfMeasureId: updateServingUnit.id,
      salesPrice: updateSalesAmount,
      cost: updateCostAmount,
      categoryId: updatedCategory.id,
      subCategoryId: updatedSubCategory.id,
    } as UpdateRecipeDto;

    const result = await recipeService.update(toUpdate.id, dto);
    if(!result?.category){ throw new Error("recipe category is null"); }
    expect(result).not.toBeNull();
    expect(result?.name).toEqual(updateName)
    expect(result?.batchResultQuantity).toEqual(updateBatchAmount);
    expect(result?.batchResultUnitOfMeasure?.id).toEqual(updateBatchUnit.id);
    expect(result?.servingSizeQuantity).toEqual(updateServingAmonut);
    expect(result?.servingSizeUnitOfMeasure?.id).toEqual(updateServingUnit.id);
    expect(result?.salesPrice).toEqual(updateSalesAmount);
    expect(result?.cost).toEqual(updateCostAmount);
    expect(result?.category?.id).toEqual(updatedCategory.id);
    expect(result?.subCategory?.id).toEqual(updatedSubCategory.id);

    const checkOldCat = await categoryService.findOne(toUpdate?.category.id, ["recipes"]);
    if(!checkOldCat){ throw new Error("category before updating not found (NO CAT)"); }
    expect(checkOldCat.recipes.findIndex(r => r.id === result?.id)).toEqual(-1);

    const checkNewCat = await categoryService.findOne(result?.category.id, ["recipes"]);
    if(!checkNewCat){ throw new Error("category after updating not found (CATEGORY A)"); }
    expect(checkNewCat.recipes.findIndex(r => r.id === result?.id)).not.toEqual(-1);
  });

  it('should remove a recipe', async () => {
    const removal = await recipeService.remove(testId);
    expect(removal).toBeTruthy();

    const verify = await recipeService.findOne(testId);
    expect(verify).toBeNull();
  });

  it('should get all recipes', async () => {
    const expected = await testingUtil.getTestRecipeEntities(dbTestContext);

    const results = await recipeService.findAll();

    expect(results.length).toEqual(expected.length);
    testIds = [ results[0].id, results[1].id, results[2].id, ]
  });

  it('should get recipes by list of ids', async () => {
    const results = await recipeService.findEntitiesById(testIds);
    expect(results).not.toBeNull();
    expect(results.length).toEqual(testIds.length);
    for(const result of results){
      expect(testIds.findIndex(id => id === result.id)).not.toEqual(-1);
    }
  });

  it('should find a recipe by name', async () => {
    const result = await recipeService.findOneByName(REC_A);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual(REC_A);
  });
});
