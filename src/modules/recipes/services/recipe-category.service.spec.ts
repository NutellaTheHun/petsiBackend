import { TestingModule } from '@nestjs/testing';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeCategoryService } from './recipe-category.service';

describe('recipe category service', () => {
  let service: RecipeCategoryService;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    service = module.get<RecipeCategoryService>(RecipeCategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // create

  // update

  // findAll

  // findOne

  // findEntitiesById

  // remove

  // findOneByName
});
