import { TestingModule } from '@nestjs/testing';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeIngredientService } from './recipe-ingredient.service';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { CreateRecipeIngredientDto } from '../dto/create-recipe-ingredient.dto';
import { RecipeService } from './recipe.service';
import { InventoryItemService } from '../../inventory-items/services/inventory-item.service';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import { REC_A } from '../utils/constants';
import { FOOD_A, OTHER_A } from '../../inventory-items/utils/constants';
import { FL_OUNCE, MILLILITER } from '../../unit-of-measure/utils/constants';
import { UpdateRecipeIngredientDto } from '../dto/update-recipe-ingedient.dto';

describe('recipe ingredient service', () => {
  let ingredientService: RecipeIngredientService;
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;

  let recipeService: RecipeService;
  let inventoryItemService: InventoryItemService;
  let unitOfMeasureService: UnitOfMeasureService;

  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    
    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initRecipeIngredientTestingDatabase(dbTestContext);

    ingredientService = module.get<RecipeIngredientService>(RecipeIngredientService);
    recipeService = module.get<RecipeService>(RecipeService);
    inventoryItemService = module.get<InventoryItemService>(InventoryItemService);
    unitOfMeasureService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(ingredientService).toBeDefined();
  });

  it('should create an ingredient', async () => {
    // recipeA - ingredients already [ (FOOD_A, 0.5, OUNCE), (DRY_A, 1.0, POUND) ]
    const recipeA = await recipeService.findOneByName(REC_A);
    if(!recipeA){ throw new Error("recipe not found"); }

    const item = await inventoryItemService.findOneByName(OTHER_A);
    if(!item){ throw new Error("inventory item not found"); }

    const unit = await unitOfMeasureService.findOneByName(FL_OUNCE);
    if(!unit){ throw new Error("unit of measure not found"); }

    const dto = {
      recipeId: recipeA.id,
      inventoryItemId: item.id,
      //subRecipeIngredientId: ,
      quantity: 1,
      unitOfMeasureId: unit.id,
    } as CreateRecipeIngredientDto;

    const result = await ingredientService.create(dto);
    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.recipe?.id).toEqual(recipeA.id);
    expect(result?.inventoryItem?.id).toEqual(item.id);
    expect(result?.quantity).toEqual(1);
    expect(result?.unit.id).toEqual(unit.id);

    testId = result?.id as number;
  });

  it('should update an ingredient', async () => {
    const toUpdate = await ingredientService.findOne(testId);
    if(!toUpdate){ throw new Error("ingredient to update is null"); }

    const updateUnit = await unitOfMeasureService.findOneByName(MILLILITER);
    if(!updateUnit){ throw new Error("unit of measure not found"); }

    const dto = {
      quantity: 3,
      unitOfMeasureId: updateUnit.id,
    } as UpdateRecipeIngredientDto;

    const result = await ingredientService.update(toUpdate.id, dto);
    expect(result).not.toBeNull();
    expect(result?.quantity).toEqual(3);
    expect(result?.unit.id).toEqual(updateUnit.id);
  });

  it('should remove an ingredient', async () => {
    const removal = await ingredientService.remove(testId);
    expect(removal).toBeTruthy();

    const verify = await ingredientService.findOne(testId);
    expect(verify).toBeNull();
  });

  it('should get all ingredients', async () => {
    const expected = await testingUtil.getTestRecipeIngredientEntities(dbTestContext);

    const results = await ingredientService.findAll();
    expect(results.length).toEqual(expected.length);
    testIds = [ results[0].id, results[1].id, results[2].id ];
  });

  it('should get ingredients by list of ids', async () => {
    const results = await ingredientService.findEntitiesById(testIds);
    expect(results.length).toEqual(testIds.length);
    for(const result of results){
      expect(testIds.findIndex(id => id === result.id)).not.toEqual(-1);
    }
  });

  it('should get a list of ingredients by recipe name', async () => {
    const expected = await recipeService.findOneByName(REC_A, ["ingredients"]);
    if(!expected){ throw new Error("recipe A not found"); }
    if(!expected.ingredients){ throw new Error("recipe A ingredients are null"); }

    const results = await ingredientService.findByRecipeName(REC_A);
    expect(results.length).toEqual(expected.ingredients.length);
  });

  it('should get a list of ingredients by inventoryItemName?', async () => {
    // 2 ingredients use FOOD_A from getTestRecipeIngredientEntities() 
    const results = await ingredientService.findByInventoryItemName(FOOD_A);
    expect(results.length).toEqual(2);
  });
});
