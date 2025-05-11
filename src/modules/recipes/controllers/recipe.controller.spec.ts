import { TestingModule } from '@nestjs/testing';
import { CreateRecipeDto } from '../dto/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/update-recipe-dto';
import { Recipe } from '../entities/recipe.entity';
import { RecipeService } from '../services/recipe.service';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeController } from './recipe.controller';
import { BadRequestException } from '@nestjs/common';

describe('recipe controller', () => {
  let controller: RecipeController;
  let service: RecipeService;
  let recipes: Recipe[];
  let id: number;

  let testId: number;

 beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    controller = module.get<RecipeController>(RecipeController);
    service = module.get<RecipeService>(RecipeService);
    recipes = [
      { name: "REC_A", batchResultQuantity: 1, servingSizeQuantity: 1, salesPrice: 10.00, cost: 5.00} as Recipe,
      { name: "REC_B", batchResultQuantity: 2, servingSizeQuantity: 2, salesPrice: 15, cost: 6 } as Recipe,
      { name: "REC_C", batchResultQuantity: 3, servingSizeQuantity: 3, salesPrice: 20, cost: 7 } as Recipe,
    ];
    id = 1;
    recipes.map(recipe => recipe.id = id++);

    jest.spyOn(service, "create").mockImplementation(async (dto: CreateRecipeDto) => {
      const exists = recipes.find(rec => rec.name === dto.name);
      if(exists){ return null; }

      const recipe = {
        id: id++,
        name: dto.name,
        batchResultQuantity: dto.batchResultQuantity,
        servingSizeQuantity: dto.servingSizeQuantity,
        salesPrice: dto.salesPrice,
        cost: dto.cost,
      } as Recipe;

      recipes.push(recipe);
      return recipe;
    });

    jest.spyOn(service, "update").mockImplementation(async (id: number, dto: UpdateRecipeDto) => {
      const existIdx = recipes.findIndex(rec => rec.id === id);
      if(existIdx === -1){ return null; }

      if(dto.name){
        recipes[existIdx].name = dto.name;
      }
      if(dto.batchResultQuantity){
        recipes[existIdx].batchResultQuantity = dto.batchResultQuantity;
      }
      if(dto.servingSizeQuantity){
        recipes[existIdx].servingSizeQuantity = dto.servingSizeQuantity;
      }
      if(dto.salesPrice){
        recipes[existIdx].salesPrice = dto.salesPrice;
      }
      if(dto.cost){
        recipes[existIdx].cost = dto.cost;
      }

      return recipes[existIdx];
    });

    jest.spyOn(service, "findOneByName").mockImplementation(async (name: string) => {
      return recipes.find(rec => rec.name === name) || null;
    });

    jest.spyOn(service, "findAll").mockResolvedValue({ items: recipes });

    jest.spyOn(service, "findOne").mockImplementation(async (id?: number) => {
      if(!id){ throw new Error(); }
      return recipes.find(rec => rec.id === id) || null;
    });

    jest.spyOn(service, "remove").mockImplementation(async (id: number) => {
      const index = recipes.findIndex(rec => rec.id === id);
      if(index === -1){ return false; }

      recipes.splice(index, 1);
      return true;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a recipe', async () => {
    const dto = {
      name: "testRecipe",
      batchResultQuantity: 1,
      servingSizeQuantity: 2,
      salesPrice: 3,
      cost: 4,
    } as CreateRecipeDto;

    const result = await controller.create(dto);
    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.name).toEqual("testRecipe");
    expect(result?.batchResultQuantity).toEqual(1);
    expect(result?.servingSizeQuantity).toEqual(2);
    expect(result?.salesPrice).toEqual(3);
    expect(result?.cost).toEqual(4);

    testId = result?.id as number;
  });

  it('should fail create a recipe', async () => {
    const dto = {
      name: "testRecipe",
      batchResultQuantity: 1,
      servingSizeQuantity: 2,
      salesPrice: 3,
      cost: 4,
    } as CreateRecipeDto;

    const result = await controller.create(dto);
    expect(result).toBeNull();
  });

  it('should find one a recipe', async () => {
    const result = await controller.findOne(testId);
    expect(result).not.toBeNull();
  });

  it('should fail find one a recipe', async () => {
    //const result = await controller.findOne(0);
    //expect(result).toBeNull();
    await expect(controller.findOne(0)).rejects.toThrow(Error);
  });

  it('should find all a recipe', async () => {
    const results = await controller.findAll();
    expect(results).not.toBeNull();
    expect(results.items.length).toBeGreaterThan(0);
  });

  it('should update a recipe', async () => {
    const dto = {
      name: "UPDATE_testRecipe",
      batchResultQuantity: 5,
      servingSizeQuantity: 6,
      salesPrice: 7,
      cost: 8,
    } as UpdateRecipeDto;

    const result = await controller.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
    expect(result?.name).toEqual("UPDATE_testRecipe");
    expect(result?.batchResultQuantity).toEqual(5);
    expect(result?.servingSizeQuantity).toEqual(6);
    expect(result?.salesPrice).toEqual(7);
    expect(result?.cost).toEqual(8);
  });

  it('should fail update a recipe', async () => {
    const dto = {
      name: "UPDATE_testRecipe",
      batchResultQuantity: 5,
      servingSizeQuantity: 6,
      salesPrice: 7,
      cost: 8,
    } as UpdateRecipeDto;

    const result = await controller.update(0, dto);
    expect(result).toBeNull();
  });

  it('should remove a recipe', async () => {
    const removal = await controller.remove(testId);
    expect(removal).toBeTruthy();
  });

  it('should fail remove a recipe', async () => {
    const removal = await controller.remove(testId);
    expect(removal).toBeFalsy();
  });
});
