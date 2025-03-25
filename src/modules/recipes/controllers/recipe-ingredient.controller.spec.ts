import { Test, TestingModule } from '@nestjs/testing';
import { RecipeController } from './recipe.controller';
import { RecipeIngredientController } from './recipe-ingredient.controller';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';

describe('recipe ingredient controller', () => {
  let controller: RecipeIngredientController;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    controller = module.get<RecipeIngredientController>(RecipeIngredientController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
