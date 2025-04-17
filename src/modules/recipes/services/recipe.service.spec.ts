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
import { REC_A, REC_B, REC_CAT_A, REC_CAT_B, REC_CAT_NONE, REC_F, REC_SUBCAT_NONE } from '../utils/constants';
import { UpdateRecipeDto } from '../dto/update-recipe-dto';
import { InventoryItemService } from '../../inventory-items/services/inventory-item.service';
import { RecipeIngredientService } from './recipe-ingredient.service';
import { FOOD_A, FOOD_B } from '../../inventory-items/utils/constants';
import { UpdateRecipeIngredientDto } from '../dto/update-recipe-ingedient.dto';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { error } from 'console';
import { NotFoundError } from 'rxjs';
import { NotFoundException } from '@nestjs/common';

describe('recipe service', () => {
  let recipeService: RecipeService;
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;

  let categoryService: RecipeCategoryService;
  let subCategoryService: RecipeSubCategoryService;
  let ingredientService: RecipeIngredientService;

  let unitOfMeasureService: UnitOfMeasureService;
  let itemService: InventoryItemService;

  let testId: number;
  let testIds: number[];

  let ingredientIds: number[];
  let testIngredientId: number;

  let testIngredDeleteId: number;
  let removalIngredIds: number[];

  let oldSubCategoryId: number;
  let newSubCategoryId: number;

  let oldCategoryId: number;
  let newCategoryId: number;

  let removalSubCatId: number;
  let removalCatId: number;
  
  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initRecipeTestingDatabase(dbTestContext);

    recipeService = module.get<RecipeService>(RecipeService);
    categoryService = module.get<RecipeCategoryService>(RecipeCategoryService);
    subCategoryService = module.get<RecipeSubCategoryService>(RecipeSubCategoryService);
    ingredientService = module.get<RecipeIngredientService>(RecipeIngredientService);

    unitOfMeasureService = module.get<UnitOfMeasureService>(UnitOfMeasureService);
    itemService = module.get<InventoryItemService>(InventoryItemService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(recipeService).toBeDefined();
  });

  it('should create a recipe (with default category and sub category)', async () => {
    const batchUnit = await unitOfMeasureService.findOneByName(POUND);
    if(!batchUnit){ throw new Error("unit of measure POUND not found"); }
    const servingUnit = await unitOfMeasureService.findOneByName(OUNCE);
    if(!servingUnit){ throw new Error("unit of measure OUNCE not found"); }

    const recName = "testRecipe";
    const batchAmount = 1;
    const servingAmonut = 2;
    const salesAmount = 10.99;
    const costAmount = 5.99

    const ingredientItems = await itemService.findAll();
    const ingredientMeasureUnits = await unitOfMeasureService.findAll();

    const ingredientDtos = testingUtil.createRecipeIngredientDtos(
      ingredientItems.map(i => i.id).slice(0,3), 
      [], 
      ingredientMeasureUnits.map(u => u.id).slice(0,3), 
      [1,2,3]
    );

    const dto = {
      name: recName,
      batchResultQuantity: batchAmount,
      batchResultUnitOfMeasureId: batchUnit.id,
      servingSizeQuantity: servingAmonut,
      servingSizeUnitOfMeasureId: servingUnit.id,
      salesPrice: salesAmount,
      cost: costAmount,
      ingredientDtos: ingredientDtos,
    } as CreateRecipeDto;

    const result = await recipeService.create(dto);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual(recName)
    expect(result?.batchResultQuantity).toEqual(batchAmount);
    expect(result?.batchResultUnitOfMeasure?.id).toEqual(batchUnit.id);
    expect(result?.servingSizeQuantity).toEqual(servingAmonut);
    expect(result?.servingSizeUnitOfMeasure?.id).toEqual(servingUnit.id);
    expect(result?.salesPrice).toEqual(salesAmount);
    expect(result?.cost).toEqual(costAmount);
    expect(result?.category?.name).toEqual(REC_CAT_NONE);
    expect(result?.subCategory?.name).toEqual(REC_SUBCAT_NONE);
    expect(result?.ingredients?.length).toEqual(3);
    
    testId = result?.id as number;
    if(result?.ingredients){
      ingredientIds = result?.ingredients?.map(i => i.id);
    }
  });

  it('recipe Ingredients should be created (queryable)', async () => {
    const results = await ingredientService.findByRecipeId(testId);
    expect(results.length).toEqual(3);
    for(const ingred of results){
      expect(ingredientIds.findIndex(id => id === ingred.id)).not.toEqual(-1);
    }
  });

  it('should update name', async () => {
    const updateName = "UPDATED testRecipe";
    const dto = {
      name: updateName
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual(updateName);
  });

  it('should update isIngredient', async () => {
    const dto = {
      isIngredient: true,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.isIngredient).toBeTruthy();
  });

  it('should update ingredients (add new ingredients)', async () => {
    const testRecipe = await recipeService.findOne(testId, ['ingredients']);
    if(!testRecipe){ throw new Error("recipe is null"); }
    if(!testRecipe.ingredients){ throw new Error("recipe ingredients is null"); }

    const testIngredients = await ingredientService.findEntitiesById(testRecipe.ingredients.map(i => i.id), ['inventoryItem', 'subRecipeIngredient', 'unit'])
    if(!testIngredients){ throw new error("recipe ingredients is null")}

    const ingredientItems = await itemService.findAll();
    const ingredientMeasureUnits = await unitOfMeasureService.findAll();

    const createIngredDtos = testingUtil.createRecipeIngredientDtos(
      ingredientItems.map(i => i.id).slice(3,7), 
      [],
      ingredientMeasureUnits.map(u => u.id).slice(0,3), 
      [4,5,6,7]
    );

    const updateIngredDtos = testIngredients.map(ingred => ({
      id: ingred.id,
      quantity: ingred.quantity,
      unitOfMeasureId: ingred.unit.id,
      subRecipeIngredientId: ingred.subRecipeIngredient?.id,
      inventoryItemId: ingred.inventoryItem?.id,
    }) as UpdateRecipeIngredientDto);

    const dto = {
      ingredientDtos: [ ...updateIngredDtos, ...createIngredDtos ]
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.ingredients?.length).toEqual(7);
  });

  it('should update ingredient (modify inventory item)', async () => {
    let testInvItemId: number;

    const testRecipe = await recipeService.findOne(testId, ['ingredients']);
    if(!testRecipe){ throw new Error("recipe is null"); }
    if(!testRecipe.ingredients){ throw new Error("recipe ingredients is null"); }
    
    const ingreds = await ingredientService.findByRecipeId(testId, ['inventoryItem', 'subRecipeIngredient', 'unit']);
    if(!ingreds){ throw new Error("ingredient is null"); }
    if(!ingreds[0].inventoryItem){ throw new Error("ingredient inventory item is null"); }
    testIngredientId = ingreds[0].id;

    if(ingreds[0].inventoryItem.name === FOOD_A){
      const item = await itemService.findOneByName(FOOD_B);
      if(!item){ throw new Error("inv item not found"); }
      ingreds[0].inventoryItem = item;
      testInvItemId = item.id;
    } else {
      const item = await itemService.findOneByName(FOOD_A);
      if(!item){ throw new Error("inv item not found"); }
      ingreds[0].inventoryItem = item;
      testInvItemId = item.id;
    }

    const ingredUpdateDtos = ingreds.map(ingred => ({
      mode: 'update',
      id: ingred.id,
      quantity: ingred.quantity,
      unitOfMeasureId: ingred.unit.id,
      subRecipeIngredientId: ingred.subRecipeIngredient?.id,
      inventoryItemId: ingred.inventoryItem?.id,
    }) as UpdateRecipeIngredientDto)
    const dto = {
      ingredientDtos: ingredUpdateDtos,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();

    const verify = await ingredientService.findOne(testIngredientId, ['inventoryItem']);
    if(!verify){ throw new Error("ingredient to verify is null"); }
    if(!verify.inventoryItem){ throw new Error("ingredient inv item is null"); }

    expect(verify.inventoryItem.id).toEqual(testInvItemId);
  });

  it('should update ingredient (modify unitOfMeasure)', async () => {
    let testUnitId: number;

    const testRecipe = await recipeService.findOne(testId, ['ingredients']);
    if(!testRecipe){ throw new Error("recipe is null"); }
    if(!testRecipe.ingredients){ throw new Error("recipe ingredients is null"); }
    
    const ingreds = await ingredientService.findByRecipeId(testId, ['inventoryItem', 'subRecipeIngredient', 'unit']);
    if(!ingreds){ throw new Error("ingredient is null"); }
    if(!ingreds[0].inventoryItem){ throw new Error("ingredient inventory item is null"); }
    testIngredientId = ingreds[0].id;

    if(ingreds[0].unit.name === POUND){
      const unit = await unitOfMeasureService.findOneByName(OUNCE);
      if(!unit){ throw new Error("inv item not found"); }
      ingreds[0].unit = unit;
      testUnitId = unit.id
    } else {
      const unit = await unitOfMeasureService.findOneByName(POUND);
      if(!unit){ throw new Error("inv item not found"); }
      ingreds[0].unit = unit;
      testUnitId = unit.id
    }

    const ingredUpdateDtos = ingreds.map(ingred => ({
      id: ingred.id,
      quantity: ingred.quantity,
      unitOfMeasureId: ingred.unit.id,
      subRecipeIngredientId: ingred.subRecipeIngredient?.id,
      inventoryItemId: ingred.inventoryItem?.id,
    }) as UpdateRecipeIngredientDto)
    const dto = {
      ingredientDtos: ingredUpdateDtos,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();

    const verify = await ingredientService.findOne(testIngredientId, ['unit']);
    if(!verify){ throw new Error("ingredient to verify is null"); }
    if(!verify.unit){ throw new Error("ingredient inv item is null"); }
    
    expect(verify.unit.id).toEqual(testUnitId);
  });

  it('should update ingredient (modify subRecipeIngredient)', async () => {
    let testSubRecipeId: number;

    const testRecipe = await recipeService.findOne(testId, ['ingredients']);
    if(!testRecipe){ throw new Error("recipe is null"); }
    if(!testRecipe.ingredients){ throw new Error("recipe ingredients is null"); }
    
    const ingreds = await ingredientService.findByRecipeId(testId, ['inventoryItem', 'subRecipeIngredient', 'unit']);
    if(!ingreds){ throw new Error("ingredient is null"); }
    testIngredientId = ingreds[0].id;

    if(!ingreds[0].subRecipeIngredient){
      const subRec = await recipeService.findOneByName(REC_B);
      if(!subRec){ throw new Error("recipe not found"); }
      ingreds[0].subRecipeIngredient = subRec;
      testSubRecipeId = subRec.id
    }
    else if(ingreds[0].subRecipeIngredient?.name === REC_A){
      const subRec = await recipeService.findOneByName(REC_B);
      if(!subRec){ throw new Error("recipe not found"); }
      ingreds[0].subRecipeIngredient = subRec;
      testSubRecipeId = subRec.id
    } 
    else {
      const subRec = await recipeService.findOneByName(REC_F);
      if(!subRec){ throw new Error("recipe not found"); }
      ingreds[0].subRecipeIngredient = subRec;
      testSubRecipeId = subRec.id
    }

    const updatedDto = {
      mode:'update',
      id: ingreds[0].id,
      subRecipeIngredientId: ingreds[0].subRecipeIngredient?.id,
    } as UpdateRecipeIngredientDto;

    const theRest = ingreds.slice(1).map(ingred => ({
      mode:'update',
      id: ingred.id,
    }) as UpdateRecipeIngredientDto);

    /*const ingredUpdateDtos = ingreds.map(ingred => ({
      mode:'update',
      id: ingred.id,
      quantity: ingred.quantity,
      unitOfMeasureId: ingred.unit.id,
      subRecipeIngredientId: ingred.subRecipeIngredient?.id,
      inventoryItemId: ingred.inventoryItem?.id,
    }) as UpdateRecipeIngredientDto)*/
    
    const dto = {
      //ingredientDtos: ingredUpdateDtos,
      ingredientDtos: [updatedDto, ...theRest],
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();

    const verify = await ingredientService.findOne(testIngredientId, ['subRecipeIngredient']);
    if(!verify){ throw new Error("ingredient to verify is null"); }
    if(!verify.subRecipeIngredient){ throw new Error("ingredient sub recipe is null"); }
    
    expect(verify.subRecipeIngredient.id).toEqual(testSubRecipeId);
  });

  it('should update ingredient (modify quantity)', async () => {
    let testQuantity: number;

    const testRecipe = await recipeService.findOne(testId, ['ingredients']);
    if(!testRecipe){ throw new Error("recipe is null"); }
    if(!testRecipe.ingredients){ throw new Error("recipe ingredients is null"); }
    
    const ingreds = await ingredientService.findByRecipeId(testId, ['inventoryItem', 'subRecipeIngredient', 'unit']);
    if(!ingreds){ throw new Error("ingredient is null"); }
    testIngredientId = ingreds[0].id;

    if(ingreds[0].quantity === 1){
      testQuantity = 2;
      ingreds[0].quantity = testQuantity;
    } else {
      testQuantity = 1;
      ingreds[0].quantity = testQuantity;
    }

    const updateDto = {
      mode: 'update',
      id: ingreds[0].id,
      quantity:ingreds[0].quantity,
    } as UpdateRecipeIngredientDto;

    const theRest = ingreds.slice(1).map(ingred => ({
      mode: 'update',
      id: ingred.id,
    }) as UpdateRecipeIngredientDto);

    const dto = {
      ingredientDtos: [updateDto, ...theRest ],
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();

    const verify = await ingredientService.findOne(testIngredientId);
    if(!verify){ throw new Error("ingredient to verify is null"); }

    expect(Number(verify.quantity)).toEqual(testQuantity);
  });

  it('should update ingredients (remove ingredients)', async () => {

    const testRecipe = await recipeService.findOne(testId, ['ingredients']);
    if(!testRecipe){ throw new Error("recipe is null"); }
    if(!testRecipe.ingredients){ throw new Error("recipe ingredients is null"); }
    
    const ingredUpdateDtos = testRecipe.ingredients.slice(1).map(ingred => ({
      id: ingred.id,
    }) as UpdateRecipeIngredientDto);

    const dto = {
      ingredientDtos: ingredUpdateDtos,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    if(!result?.ingredients){ throw new Error("recipe ingredients is null")}

    expect(result).not.toBeNull();
    expect(result?.ingredients?.length).toEqual(6);

    testIngredDeleteId = result?.ingredients[0].id as number;
  });

  it('should remove all but 6 recipe ingredient from table', async () => {
    const ingreds = await ingredientService.findByRecipeId(testId);
    expect(ingreds).not.toBeNull();
    expect(ingreds.length).toEqual(6);
  });

  it('should update batch UnitOfMeaure', async () => {
    const batchUnit = await unitOfMeasureService.findOneByName(KILOGRAM);
    if(!batchUnit){ throw new Error("unit of measure kilogram not found"); }
    
    const dto = {
      batchResultUnitOfMeasureId: batchUnit.id,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.batchResultUnitOfMeasure?.name).toEqual(KILOGRAM);
  });

  it('should update servingSize UnitOfMeasure', async () => {
    const servingUnit = await unitOfMeasureService.findOneByName(GRAM);
    if(!servingUnit){ throw new Error("unit of measure gram not found"); }
    const dto = {
      servingSizeUnitOfMeasureId: servingUnit.id,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.servingSizeUnitOfMeasure?.name).toEqual(GRAM);
  });

  it('should update batch result quantity', async () => {
    const updateBatchAmount = 2;
    const dto = {
      batchResultQuantity: updateBatchAmount,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.batchResultQuantity).toEqual(updateBatchAmount);
  });

  it('should update serving size quantity', async () => {
    const updateServingAmount = 4;
    const dto = {
      servingSizeQuantity: updateServingAmount,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.servingSizeQuantity).toEqual(updateServingAmount);
  });

  it('should update sales price', async () => {
    const updateSalesAmount = 14.99;
    const dto = {
      salesPrice: updateSalesAmount,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.salesPrice).toEqual(updateSalesAmount);
  });

  it('should update cost', async () => {
    const updateCostAmount = 8.99;
    const dto = {
      cost: updateCostAmount
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.cost).toEqual(updateCostAmount);
  });

  it('should update category', async () => {
    const testRecipe = await recipeService.findOne(testId, ["category"]);
    if(!testRecipe){ throw new Error("recipe is null"); }

    oldCategoryId = testRecipe.category?.id as number;

    let newCat: RecipeCategory;
    if(testRecipe.category?.name === REC_CAT_A){
      const cat = await categoryService.findOneByName(REC_CAT_B);
      if(!cat){ throw new Error("recipe category is null"); }
      newCat = cat;
    } else {
      const cat = await categoryService.findOneByName(REC_CAT_A);
      if(!cat){ throw new Error("recipe category is null"); }
      newCat = cat;
    }

    newCategoryId = newCat.id;

    const updatedCategory = await categoryService.findOneByName(REC_CAT_A, ["subCategories"]);
    if(!updatedCategory){ throw new Error("category A for update is null"); }
    
    const dto = {
      categoryId: newCategoryId,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
  });

  it('should lose reference from old category', async () => {
    const oldCat = await categoryService.findOne(oldCategoryId, ['recipes']);
    if(!oldCat){ throw new Error("category is null"); }
    expect(oldCat.recipes.findIndex(rec => rec.id === testId)).toEqual(-1);
  });

  it('should gain reference for new category', async () => {
    const newCat = await categoryService.findOne(newCategoryId, ['recipes']);
    if(!newCat){ throw new Error("category is null"); }
    expect(newCat.recipes.findIndex(rec => rec.id === testId)).not.toEqual(-1);
  });

  it('should update sub category', async () => {
    const testRecipe = await recipeService.findOne(testId, ['category', 'subCategory']);
    if(!testRecipe){ throw new Error("recipe is null"); }
    if(!testRecipe.category){ throw new Error("recipe category is null"); }

    oldSubCategoryId = testRecipe.subCategory?.id as number;

    const category = await categoryService.findOne(testRecipe.category.id, ["subCategories"]);
    if(!category){ throw new Error("category is null"); }
    if(!category.subCategories){ throw new Error("category subCategories is null"); }

    let updatedSubCategory: RecipeSubCategory;
    if(testRecipe.subCategory?.id === category.subCategories[0].id){
      updatedSubCategory = category.subCategories[1];
    } else {
      updatedSubCategory = category.subCategories[0];
    }

    newSubCategoryId = updatedSubCategory.id;
     
    const dto = {
      subCategoryId: updatedSubCategory.id,
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    if(!result?.subCategory){ throw new Error("recipe subCategory is null"); }

    expect(result).not.toBeNull();
    expect(result?.subCategory.id).toEqual(updatedSubCategory.id);
  });

  it('should lose reference from old sub category', async () => {
    const oldSubCat = await subCategoryService.findOne(oldSubCategoryId, ['recipes']);
    if(!oldSubCat){ throw new Error("sub category is null"); }
    expect(oldSubCat.recipes.findIndex(rec => rec.id === testId)).toEqual(-1);
  });

  it('should gain reference from new sub category', async () => {
    const newSubCat = await subCategoryService.findOne(newSubCategoryId, ['recipes']);
    if(!newSubCat){ throw new Error("sub category is null"); }
    expect(newSubCat.recipes.findIndex(rec => rec.id === testId)).not.toEqual(-1);
  });
  
  it('should update sub category (to no sub category)', async () => {
    const dto = {
      subCategoryId: 0
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.subCategory?.name).toEqual(REC_SUBCAT_NONE);
  });

  it('should have default sub category (NO CATEGORY)', async () => {
    const testRecipe = await recipeService.findOne(testId, ['subCategory']);
    if(!testRecipe){ throw new Error("recipe is null"); }
    expect(testRecipe.subCategory?.name).toEqual(REC_SUBCAT_NONE);
  });

  it('should update category (to no category)', async () => {
    const dto = {
      categoryId: 0
    } as UpdateRecipeDto;

    const result = await recipeService.update(testId, dto);
    expect(result).not.toBeNull();
    

    const verify = await recipeService.findOne(testId, ['category', 'subCategory']);
    if(!verify){ throw new NotFoundException(); }
    expect(verify?.category?.name).toEqual(REC_CAT_NONE);
    expect(verify?.subCategory?.name).toEqual(REC_SUBCAT_NONE);
  });

  it('should find a recipe by name', async () => {
    const result = await recipeService.findOneByName(REC_A);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual(REC_A);
  });

  it('should remove a recipe', async () => {
    const removalRecipe = await recipeService.findOne(testId, ['category', 'subCategory', 'ingredients']);
    if(!removalRecipe){ throw new Error("recipe to remove is null"); }
    if(!removalRecipe.category){ throw new Error(""); }
    if(!removalRecipe.subCategory){ throw new Error(""); }
    if(!removalRecipe.ingredients){ throw new Error(""); }

    removalCatId = removalRecipe.category?.id;
    removalSubCatId = removalRecipe.subCategory?.id;
    removalIngredIds = removalRecipe.ingredients.map(ingred => ingred.id);

    const removal = await recipeService.remove(removalRecipe?.id);
    expect(removal).toBeTruthy();

    const verify = await recipeService.findOne(removalRecipe?.id);
    expect(verify).toBeNull();
  });

  it('should delete recipe ingredients', async () => {
    const ingreds = await ingredientService.findEntitiesById(removalIngredIds);
    expect(ingreds.length).toEqual(0);
  });

  it('should lose reference from sub category', async () => {
    const subCat = await subCategoryService.findOne(removalSubCatId, ['recipes']);
    if(!subCat){ throw new Error("sub category is null"); }
    if(!subCat.recipes){ throw new Error("recipes is null"); }
    expect(subCat.recipes.findIndex(r => r.id === removalSubCatId)).toEqual(-1)
  });

  it('should lose reference from category', async () => {
    const cat = await categoryService.findOne(removalCatId, ['recipes']);
    if(!cat){ throw new Error("category is null"); }
    if(!cat.recipes){ throw new Error("recipes is null"); }
    expect(cat.recipes.findIndex(r => r.id === removalCatId)).toEqual(-1)
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

  it('should find ingredients where isIngredient is true', async () => {
    
  });
});
