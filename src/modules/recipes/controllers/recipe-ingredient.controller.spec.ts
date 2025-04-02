import { TestingModule } from '@nestjs/testing';
import { RecipeIngredientController } from './recipe-ingredient.controller';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeIngredientService } from '../services/recipe-ingredient.service';
import { NotImplementedException } from '@nestjs/common';
import { CreateRecipeIngredientDto } from '../dto/create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../dto/update-recipe-ingedient.dto';

describe('recipe ingredient controller', () => {
  let controller: RecipeIngredientController;
  let service: RecipeIngredientService;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    controller = module.get<RecipeIngredientController>(RecipeIngredientController);
    service = module.get<RecipeIngredientService>(RecipeIngredientService);

    jest.spyOn(service, "create").mockImplementation(async (dto: CreateRecipeIngredientDto) => {
      throw new NotImplementedException();
    });

    jest.spyOn(service, "update").mockImplementation(async (id: number, dto: UpdateRecipeIngredientDto) => {
      throw new NotImplementedException();
    });

    jest.spyOn(service, "findByRecipeName").mockImplementation(async (name: string) => {
      throw new NotImplementedException();
    });

    jest.spyOn(service, "findByInventoryItemName").mockImplementation(async (name: string) => {
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
});
