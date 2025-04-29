import { TestingModule } from '@nestjs/testing';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeIngredientService } from './recipe-ingredient.service';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { CreateRecipeIngredientDto } from '../dto/create-recipe-ingredient.dto';
import { RecipeService } from './recipe.service';
import { InventoryItemService } from '../../inventory-items/services/inventory-item.service';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import { REC_A, REC_B, REC_C } from '../utils/constants';
import { DRY_A, FOOD_A, OTHER_A } from '../../inventory-items/utils/constants';
import { FL_OUNCE, GALLON, MILLILITER } from '../../unit-of-measure/utils/constants';
import { UpdateRecipeIngredientDto } from '../dto/update-recipe-ingedient.dto';
import { NotFoundException } from '@nestjs/common';

describe('recipe ingredient service', () => {
  let ingredientService: RecipeIngredientService;
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;

  let recipeService: RecipeService;
  let inventoryItemService: InventoryItemService;
  let unitOfMeasureService: UnitOfMeasureService;

  let testIngredId: number;
  let testSubRecId: number;
  let testIds: number[];
  let testRecipeId: number;


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

  it('should create recipe ingredient (inventoryItem)', async() => {
    // recipeA - ingredients already [ (FOOD_A, 0.5, OUNCE), (DRY_A, 1.0, POUND) ]
    const recipeA = await recipeService.findOneByName(REC_A);
    if(!recipeA){ throw new Error("recipe not found"); }

    const item = await inventoryItemService.findOneByName(OTHER_A);
    if(!item){ throw new Error("inventory item not found"); }

    const unit = await unitOfMeasureService.findOneByName(FL_OUNCE);
    if(!unit){ throw new Error("unit of measure not found"); }

    const dto = {
      mode: 'create',
      recipeId: recipeA.id,
      inventoryItemId: item.id,
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

    testIngredId = result?.id as number;
    testRecipeId = recipeA.id;
  });

  it('should be referenced in recipe query', async() => {
    const testRecipe = await recipeService.findOne(testRecipeId, ['ingredients']);
    if(!testRecipe){ throw new NotFoundException(); }

    expect(testRecipe.ingredients?.findIndex(ingred => ingred.id === testIngredId)).not.toEqual(-1);
  });

  it('should create recipe ingredient (subRecipeIngredient', async() => {
     // recipeA - ingredients already [ (FOOD_A, 0.5, OUNCE), (DRY_A, 1.0, POUND) ]
     const recipeA = await recipeService.findOneByName(REC_A);
     if(!recipeA){ throw new Error("recipe not found"); }
 
     const subRec = await recipeService.findOneByName(REC_C);
     if(!subRec){ throw new Error("inventory item not found"); }
 
     const unit = await unitOfMeasureService.findOneByName(FL_OUNCE);
     if(!unit){ throw new Error("unit of measure not found"); }
 
     const dto = {
       mode: 'create',
       recipeId: recipeA.id,
       subRecipeIngredientId: subRec.id,
       quantity: 1,
       unitOfMeasureId: unit.id,
     } as CreateRecipeIngredientDto;
 
     const result = await ingredientService.create(dto);
     expect(result).not.toBeNull();
     expect(result?.id).not.toBeNull();
     expect(result?.recipe?.id).toEqual(recipeA.id);
     expect(result?.subRecipeIngredient?.id).toEqual(subRec.id);
     expect(result?.quantity).toEqual(1);
     expect(result?.unit.id).toEqual(unit.id);
 
     testSubRecId = result?.id as number;
  });

  it('should find ingredient by id', async() => {
    const result = await ingredientService.findOne(testIngredId);
    expect(result).not.toBeNull();
  });

  it('should update inventoryItem', async() => {
    const newItem = await inventoryItemService.findOneByName(DRY_A);
    if(!newItem){ throw new Error("inventory item not found"); }

    const dto = {
      mode: 'update',
      inventoryItemId: newItem.id,
    } as UpdateRecipeIngredientDto;

    const result = await ingredientService.update(testSubRecId, dto);

    expect(result).not.toBeNull();
    expect(result?.inventoryItem?.id).toEqual(newItem.id);
  });

  it('should lose subRecipeIngredient reference', async() => {
    const result = await ingredientService.findOne(testSubRecId, ['inventoryItem', 'subRecipeIngredient']);
    expect(result).not.toBeNull();

    expect(result?.inventoryItem).not.toBeNull();
    expect(result?.subRecipeIngredient).toBeNull();
  });

  it('should update subRecipeIngredient', async() => {
    const newRec = await recipeService.findOneByName(REC_C);
    if(!newRec){ throw new Error("inventory item not found"); }

    const dto = {
      mode: 'update',
      subRecipeIngredientId: newRec.id,
    } as UpdateRecipeIngredientDto;

    const result = await ingredientService.update(testIngredId, dto);

    expect(result).not.toBeNull();
    expect(result?.subRecipeIngredient?.id).toEqual(newRec.id);
  });

  it('should lose ingredient reference', async() => {
    const result = await ingredientService.findOne(testIngredId, ['inventoryItem', 'subRecipeIngredient']);
    expect(result).not.toBeNull();

    expect(result?.inventoryItem).toBeNull();
    expect(result?.subRecipeIngredient).not.toBeNull();
  });

  it('should update quantity', async() => {
    const dto = {
      mode: 'update',
      quantity: 10,
    } as UpdateRecipeIngredientDto;

    const result = await ingredientService.update(testIngredId, dto);

    expect(result).not.toBeNull();
    expect(result?.quantity).toEqual(10);
  });

  it('should update unit of measure', async() => {
    const newUnit = await unitOfMeasureService.findOneByName(GALLON);
    if(!newUnit){ throw new Error("unit of measure not found"); }

    const dto = {
      mode: 'update',
      unitOfMeasureId: newUnit.id,
    } as UpdateRecipeIngredientDto;

    const result = await ingredientService.update(testIngredId, dto);

    expect(result).not.toBeNull();
    expect(result?.unit.id).toEqual(newUnit.id);
  });

  it('should get all ingredients', async () => {
    const expected = await testingUtil.getTestRecipeIngredientEntities(dbTestContext);

    const results = await ingredientService.findAll({ limit: 15 });
    expect(results.items.length).toEqual(expected.length + 2);
    testIds = [ results.items[0].id, results.items[1].id, results.items[2].id ];
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

  it('should remove recipe ingredient', async() => {
    const removal = await ingredientService.remove(testSubRecId);
    expect(removal).toBeTruthy();

    const verify = await ingredientService.findOne(testSubRecId);
    expect(verify).toBeNull();
  });

  it('should not be referenced in recipe query', async() => {
    const testRecipe = await recipeService.findOne(testRecipeId, ['ingredients']);
    if(!testRecipe){ throw new NotFoundException(); }

    expect(testRecipe.ingredients?.findIndex(ingred => ingred.id === testSubRecId)).toEqual(-1);
  });

  it('should delete ingredient when deleting recipe', async () => {
    const expected = await recipeService.findOneByName(REC_B, ["ingredients"]);
    if(!expected){ throw new Error("recipe B not found"); }
    if(!expected.ingredients){ throw new Error("recipe B ingredients are null"); }

    const ids = (await ingredientService.findByRecipeName(REC_B)).map(ingred => ingred.id);
    
    await recipeService.remove(expected.id);

    const verify = await ingredientService.findEntitiesById(ids);
    expect(verify.length).toEqual(0);
  });

  it('should delete ingredient when deleting inventory item', async () => {
    const item = await inventoryItemService.findOneByName(FOOD_A);
    if(!item){ throw new NotFoundException(); }

    const ids = (await ingredientService.findByInventoryItemName(FOOD_A)).map(ingred => ingred.id);
    
    await inventoryItemService.remove(item.id);

    const verify = await ingredientService.findEntitiesById(ids);
    expect(verify.length).toEqual(0);
  });

  it('should delete ingredient when deleting subRecipe', async () => {
    const ingredient = await ingredientService.findOne(testIngredId, ['subRecipeIngredient']);
    if(!ingredient){ throw new NotFoundException(); }
    if(!ingredient.subRecipeIngredient){ throw new Error();}

    await recipeService.remove(ingredient.subRecipeIngredient?.id);

    const verify = await ingredientService.findOne(testIngredId);
    expect(verify).toBeNull();
  });
});
