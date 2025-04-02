import { TestingModule } from '@nestjs/testing';
import { RecipeController } from './recipe.controller';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeService } from '../services/recipe.service';
import { NotImplementedException } from '@nestjs/common';
import { CreateRecipeDto } from '../dto/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/update-recipe-dto';

describe('recipe controller', () => {
  let controller: RecipeController;
  let service: RecipeService;

 beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    controller = module.get<RecipeController>(RecipeController);
    service = module.get<RecipeService>(RecipeService);

    jest.spyOn(service, "create").mockImplementation(async (dto: CreateRecipeDto) => {
      throw new NotImplementedException();
    });

    jest.spyOn(service, "update").mockImplementation(async (id: number, dto: UpdateRecipeDto) => {
      throw new NotImplementedException();
    });

    jest.spyOn(service, "findOneByName").mockImplementation(async (name: string) => {
      throw new NotImplementedException();
    });

    jest.spyOn(service, "findAll").mockImplementation();

    jest.spyOn(service, "findOne").mockImplementation(async (id: number) => {
      throw new NotImplementedException();
    });

    jest.spyOn(service, "remove").mockImplementation(async (id: number) => {
      throw new NotImplementedException();
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
