import { TestingModule } from '@nestjs/testing';
import { CreateRecipeDto } from '../dto/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/update-recipe-dto';
import { Recipe } from '../entities/recipe.entity';
import { RecipeService } from '../services/recipe.service';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeController } from './recipe.controller';

describe('recipe controller', () => {
  let controller: RecipeController;
  let service: RecipeService;
  let recipes: Recipe[];
  let id: number;

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
      const existIdx = recipes.findIndex(rec => rec.name === dto.name);
      if(!existIdx){ return null; }

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

    jest.spyOn(service, "findAll").mockResolvedValue(recipes);

    jest.spyOn(service, "findOne").mockImplementation(async (id: number) => {
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

  });

  it('should fail create a recipe', async () => {

  });

  it('should find one a recipe', async () => {

  });

  it('should fail find one a recipe', async () => {

  });

  it('should find all a recipe', async () => {

  });

  it('should update a recipe', async () => {

  });

  it('should fail update a recipe', async () => {

  });

  it('should remove a recipe', async () => {

  });

  it('should fail remove a recipe', async () => {

  });
});
