import { TestingModule } from '@nestjs/testing';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeIngredientService } from './recipe-ingredient.service';

describe('recipe ingredient service', () => {
  let service: RecipeIngredientService;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    service = module.get<RecipeIngredientService>(RecipeIngredientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
