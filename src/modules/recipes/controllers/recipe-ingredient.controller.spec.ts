import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { AppHttpException } from '../../../util/exceptions/AppHttpException';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { CreateRecipeIngredientDto } from '../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../dto/recipe-ingredient/update-recipe-ingedient.dto';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { Recipe } from '../entities/recipe.entity';
import { RecipeIngredientService } from '../services/recipe-ingredient.service';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeIngredientController } from './recipe-ingredient.controller';

describe('recipe ingredient controller', () => {
  let controller: RecipeIngredientController;
  let service: RecipeIngredientService;

  let testId: number;

  let ingredients: RecipeIngredient[];
  let ingredId: number;

  let recipes: Recipe[];
  let recId: number;

  let units: UnitOfMeasure[];
  let unitId: number;

  let items: InventoryItem[];
  let itemId: number;
  
  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    controller = module.get<RecipeIngredientController>(RecipeIngredientController);
    service = module.get<RecipeIngredientService>(RecipeIngredientService);

    recipes = [
      { recipeName: "REC_A", batchResultQuantity: 1, servingSizeQuantity: 1, salesPrice: "10.00" } as Recipe,
      { recipeName: "REC_B", batchResultQuantity: 2, servingSizeQuantity: 2,salesPrice: "15" } as Recipe,
      { recipeName: "REC_C", batchResultQuantity: 3, servingSizeQuantity: 3,salesPrice: "20 "} as Recipe,
    ];
    recId = 1;
    recipes.map(recipe => recipe.id = recId++);

    units = [
      { name: "POUND" } as UnitOfMeasure,
      { name: "OUNCE" } as UnitOfMeasure,
      { name: "KILOGRAM" } as UnitOfMeasure,
      { name: "GRAM" } as UnitOfMeasure,
    ];
    unitId = 1;
    units.map(unit => unit.id = unitId++);

    items = [
      {itemName: "ITEM_A" } as InventoryItem,
      {itemName: "ITEM_B" } as InventoryItem,
      {itemName: "ITEM_C" } as InventoryItem,
      {itemName: "ITEM_D" } as InventoryItem,
      {itemName: "ITEM_E" } as InventoryItem,
      {itemName: "ITEM_F" } as InventoryItem,
    ]; 
    itemId = 1;
    items.map(item => item.id = itemId++);

    ingredients = [
      { parentRecipe: recipes[0], ingredientInventoryItem: items[0], quantity: 1, quantityMeasure: units[0] } as RecipeIngredient,
      { parentRecipe: recipes[0], ingredientInventoryItem: items[1], quantity: 2, quantityMeasure: units[1] } as RecipeIngredient,
      { parentRecipe: recipes[1], ingredientInventoryItem: items[2], quantity: 3, quantityMeasure: units[2] } as RecipeIngredient,
      { parentRecipe: recipes[1], ingredientInventoryItem: items[3], quantity: 4, quantityMeasure: units[3] } as RecipeIngredient,
      { parentRecipe: recipes[2], ingredientInventoryItem: items[4], quantity: 5, quantityMeasure: units[0] } as RecipeIngredient,
      { parentRecipe: recipes[2], ingredientInventoryItem: items[5], quantity: 6, quantityMeasure: units[1] } as RecipeIngredient,
    ];
    ingredId = 1;
    ingredients.map(ingred => ingred.id = ingredId++);
    
    jest.spyOn(service, "create").mockImplementation(async (dto: CreateRecipeIngredientDto) => {
      const recipe = recipes.find(rec => rec.id === dto.parentRecipeId);
      if(!recipe){ throw new Error("recipe not found"); }

      const item = items.find(item => item.id === dto.ingredientInventoryItemId);
      if(!item){ throw new Error('item not found'); }

      const unit = units.find(unit => unit.id === dto.quantityMeasurementId);
      if(!unit){ throw new Error("unit not found"); }

      const ingred = {
        id: ingredId++,
        parentRecipe: recipe,
        ingredientInventoryItem: item,
        quantity: dto.quantity,
        quantityMeasure: unit,
      } as RecipeIngredient;

      ingredients.push(ingred);
      return ingred;
    });

    jest.spyOn(service, "update").mockImplementation(async (id: number, dto: UpdateRecipeIngredientDto) => {
      const existIdx = ingredients.findIndex(ingred => ingred.id === id);
      if(existIdx === -1){ throw new NotFoundException(); }

      if(dto.ingredientInventoryItemId){
        const item = items.find(item => item.id === dto.ingredientInventoryItemId);
        if(!item){ throw new Error('item not found'); }
        ingredients[existIdx].ingredientInventoryItem = item;
      }
      if(dto.quantity){
        ingredients[existIdx].quantity = dto.quantity;
      }
      if(dto.recipeId){
        const recipe = recipes.find(rec => rec.id === dto.recipeId);
        if(!recipe){ throw new Error("recipe not found"); }
        ingredients[existIdx].parentRecipe = recipe;
      }
      if(dto.quantityMeasurementId){
        const unit = units.find(unit => unit.id === dto.quantityMeasurementId);
        if(!unit){ throw new Error("unit not found"); }
        ingredients[existIdx].quantityMeasure = unit;
      }

      return ingredients[existIdx];
    });

    jest.spyOn(service, "findByRecipeName").mockImplementation(async (name: string) => {
      return ingredients.filter(ingred => ingred.parentRecipe.recipeName === name) || null;
    });

    jest.spyOn(service, "findByInventoryItemName").mockImplementation(async (name: string) => {
      return ingredients.filter(ingred => ingred.parentRecipe.recipeName === name) || null;
    });

    jest.spyOn(service, "findAll").mockResolvedValue({ items: ingredients });

    jest.spyOn(service, "findOne").mockImplementation(async (id?: number) => {
      if(!id){ throw new BadRequestException(); }
      const result = ingredients.find(ingred => ingred.id === id);
      if(!result){
        throw new NotFoundException();
      }
      return result;
    });

    jest.spyOn(service, "remove").mockImplementation(async (id: number) => {
      const index = ingredients.findIndex(ingred => ingred.id === id);
      if(index === -1){ return false; }

      ingredients.splice(index, 1);
      return true;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a recipe ingredient', async () => {
    const dto = {
      parentRecipeId: recipes[0].id,
      ingredientInventoryItemId: items[2].id,
      quantity: 1,
      quantityMeasurementId: units[2].id,
    } as CreateRecipeIngredientDto;
    const result = await controller.create(dto);
    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.parentRecipe.id).toEqual(recipes[0].id);
    expect(result?.ingredientInventoryItem?.id).toEqual(items[2].id);
    expect(result?.quantity).toEqual(1);
    expect(result?.quantityMeasure.id).toEqual(units[2].id);

    testId = result?.id as number;
  });

  it('should find one a recipe ingredient', async () => {
    const result = await controller.findOne(testId);
    expect(result).not.toBeNull();
  });

  it('should fail find one a recipe ingredient', async () => {
    await expect(controller.findOne(0)).rejects.toThrow(BadRequestException);
  });

  it('should find all a recipe ingredient', async () => {
    const results = await controller.findAll();
    expect(results).not.toBeNull();
    expect(results.items.length).toBeGreaterThan(0);
  });

  it('should update a recipe ingredient', async () => {
    const dto = {
      parentRecipeId: recipes[1].id,
      ingredientInventoryItemId: items[4].id,
      quantity: 4,
      quantityMeasurementId: units[3].id,
    } as CreateRecipeIngredientDto;
    const result = await controller.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.parentRecipe.id).toEqual(recipes[1].id);
    expect(result?.ingredientInventoryItem?.id).toEqual(items[4].id);
    expect(result?.quantity).toEqual(4);
    expect(result?.quantityMeasure.id).toEqual(units[3].id);
  });

  it('should fail update a recipe ingredient', async () => {
    const dto = {
      parentRecipeId: recipes[1].id,
      ingredientInventoryItemId: items[4].id,
      quantity: 4,
      quantityMeasurementId: units[3].id,
    } as CreateRecipeIngredientDto;

    await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
  });

  it('should remove a recipe ingredient', async () => {
    const removal = await controller.remove(testId);
    expect(removal).toBeUndefined();
  });

  it('should fail remove a recipe ingredient', async () => {
    await expect(controller.remove(testId)).rejects.toThrow(NotFoundException);
  });
});
