import { TestingModule } from '@nestjs/testing';
import { RecipeController } from './recipe.controller';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';

describe('recipe controller', () => {
  let controller: RecipeController;

 beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    controller = module.get<RecipeController>(RecipeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
