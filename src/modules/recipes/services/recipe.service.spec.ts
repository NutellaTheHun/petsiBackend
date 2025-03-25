import { TestingModule } from '@nestjs/testing';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeService } from './recipe.service';

describe('recipe service', () => {
  let service: RecipeService;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    service = module.get<RecipeService>(RecipeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
