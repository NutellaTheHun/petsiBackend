import { Test, TestingModule } from '@nestjs/testing';
import { RecipeSubCategoryController } from './recipe-sub-category.controller';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';

describe('recipe sub category controller', () => {
  let controller: RecipeSubCategoryController;

  beforeAll(async () => {
      const module: TestingModule = await getRecipeTestingModule();
  }).compile();

    controller = module.get<RecipeSubCategoryController>(RecipeSubCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
