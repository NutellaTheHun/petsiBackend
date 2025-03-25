import { Test, TestingModule } from '@nestjs/testing';
import { RecipeCategoryController } from './recipe-category.controller';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';

describe('recipe category controller', () => {
  let controller: RecipeCategoryController;

  beforeAll(async () => {
     const module: TestingModule = await getRecipeTestingModule();
    

    controller = module.get<RecipeCategoryController>(RecipeCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
