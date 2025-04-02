import { TestingModule } from '@nestjs/testing';
import { RecipeIngredientController } from './recipe-ingredient.controller';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeIngredientService } from '../services/recipe-ingredient.service';
import { NotImplementedException } from '@nestjs/common';
import { CreateRecipeIngredientDto } from '../dto/create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../dto/update-recipe-ingedient.dto';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { Recipe } from '../entities/recipe.entity';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';

describe('recipe ingredient controller', () => {
  let controller: RecipeIngredientController;
  let service: RecipeIngredientService;

  let ingredients: RecipeIngredient[];
  let ingredId: number;

  let recipes: Recipe[];
  let recId: number;

  let units: UnitOfMeasure[];
  let unitId: number;

  let inventoryItem: InventoryItem[];
  let itemId: number;
  
  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    controller = module.get<RecipeIngredientController>(RecipeIngredientController);
    service = module.get<RecipeIngredientService>(RecipeIngredientService);

    recipes = [
      { name: "REC_A", batchResultQuantity: 1, servingSizeQuantity: 1, salesPrice: 10.00, cost: 5.00} as Recipe,
      { name: "REC_B", batchResultQuantity: 2, servingSizeQuantity: 2,salesPrice: 15, cost: 6 } as Recipe,
      { name: "REC_C", batchResultQuantity: 3, servingSizeQuantity: 3,salesPrice: 20, cost: 7 } as Recipe,
    ];
    recId = 1;
    recipes.map(recipe => recipe.id = recId++);

    let units = [
      { name: "POUND" } as UnitOfMeasure,
      { name: "OUNCE" } as UnitOfMeasure,
      { name: "KILOGRAM" } as UnitOfMeasure,
      { name: "GRAM" } as UnitOfMeasure,
    ];
    unitId = 1;
    units.map(unit => unit.id = unitId++);

    let items = [
      {name: "ITEM_A" } as InventoryItem,
      {name: "ITEM_B" } as InventoryItem,
      {name: "ITEM_C" } as InventoryItem,
      {name: "ITEM_D" } as InventoryItem,
      {name: "ITEM_E" } as InventoryItem,
      {name: "ITEM_F" } as InventoryItem,
    ]; 
    itemId = 1;
    items.map(item => item.id = itemId++);

    ingredients = [
      { recipe: recipes[0], inventoryItem: items[0], quantity: 1, unit: units[0] } as RecipeIngredient,
      { recipe: recipes[0], inventoryItem: items[1], quantity: 2, unit: units[1] } as RecipeIngredient,
      { recipe: recipes[1], inventoryItem: items[2], quantity: 3, unit: units[2] } as RecipeIngredient,
      { recipe: recipes[1], inventoryItem: items[3], quantity: 4, unit: units[3] } as RecipeIngredient,
      { recipe: recipes[2], inventoryItem: items[4], quantity: 5, unit: units[0] } as RecipeIngredient,
      { recipe: recipes[2], inventoryItem: items[5], quantity: 6, unit: units[1] } as RecipeIngredient,
    ];
    ingredId = 1;
    ingredients.map(ingred => ingred.id = ingredId++);
    
    jest.spyOn(service, "create").mockImplementation(async (dto: CreateRecipeIngredientDto) => {
      const recipe = recipes.find(rec => rec.id === dto.recipeId);
      if(!recipe){ throw new Error("recipe not found"); }

      const item = items.find(item => item.id === dto.inventoryItemId);
      if(!item){ throw new Error('item not found'); }

      const unit = units.find(unit => unit.id === dto.unitOfMeasureId);
      if(!unit){ throw new Error("unit not found"); }

      const ingred = {
        id: ingredId++,
        recipe: recipe,
        inventoryItem: item,
        quantity: dto.quantity,
        unit: unit,
      } as RecipeIngredient;

      ingredients.push(ingred);
      return ingred;
    });

    jest.spyOn(service, "update").mockImplementation(async (id: number, dto: UpdateRecipeIngredientDto) => {
      const existIdx = ingredients.findIndex(ingred => ingred.id === id);
      if(!existIdx){ return null; }

      if(dto.inventoryItemId){
        const item = items.find(item => item.id === dto.inventoryItemId);
        if(!item){ throw new Error('item not found'); }
        ingredients[existIdx].inventoryItem = item;
      }
      if(dto.quantity){
        ingredients[existIdx].quantity = dto.quantity;
      }
      if(dto.recipeId){
        const recipe = recipes.find(rec => rec.id === dto.recipeId);
        if(!recipe){ throw new Error("recipe not found"); }
        ingredients[existIdx].recipe = recipe;
      }
      if(dto.unitOfMeasureId){
        const unit = units.find(unit => unit.id === dto.unitOfMeasureId);
        if(!unit){ throw new Error("unit not found"); }
        ingredients[existIdx].unit = unit;
      }

      return ingredients[existIdx];
    });

    jest.spyOn(service, "findByRecipeName").mockImplementation(async (name: string) => {
      return ingredients.filter(ingred => ingred.recipe.name === name) || null;
    });

    jest.spyOn(service, "findByInventoryItemName").mockImplementation(async (name: string) => {
      return ingredients.filter(ingred => ingred.recipe.name === name) || null;
    });

    jest.spyOn(service, "findAll").mockResolvedValue(ingredients);

    jest.spyOn(service, "findOne").mockImplementation(async (id: number) => {
      return ingredients.find(ingred => ingred.id === id) || null;
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

  });

  it('should fail create a recipe ingredient', async () => {

  });

  it('should find one a recipe ingredient', async () => {

  });

  it('should fail find one a recipe ingredient', async () => {

  });

  it('should find all a recipe ingredient', async () => {

  });

  it('should update a recipe ingredient', async () => {

  });

  it('should fail update a recipe ingredient', async () => {

  });

  it('should remove a recipe ingredient', async () => {

  });

  it('should fail remove a recipe ingredient', async () => {

  });
});
