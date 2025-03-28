import { TestingModule } from '@nestjs/testing';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeSubCategoryService } from './recipe-sub-category.service';

describe('recipe sub category service', () => {
  let service: RecipeSubCategoryService;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    service = module.get<RecipeSubCategoryService>(RecipeSubCategoryService);
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

  // findByCategoryName

  // findByCategorynameAndSubCategoryName
});
