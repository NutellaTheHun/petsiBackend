import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeSubCategoryService } from './recipe-sub-category.service';

class TestableRecipeSubCategoryService extends RecipeSubCategoryService {
  async createEntityForTest(
    dto: CreateRecipeSubCategoryDto,
    manager: EntityManager,
  ): Promise<RecipeSubCategory> {
    return this.createEntity(dto, manager);
  }

  async updateEntityForTest(
    dto: UpdateRecipeSubCategoryDto,
    entity: RecipeSubCategory,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('recipe sub category service', () => {
  let subCategoryService: RecipeSubCategoryService;
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let recipeSubCategoryRepo: Repository<RecipeSubCategory>;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule({
      recipeSubCategoryServiceClass: TestableRecipeSubCategoryService,
    });
    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initRecipeSubCategoryTestingDatabase(dbTestContext);

    subCategoryService = module.get<RecipeSubCategoryService>(
      RecipeSubCategoryService,
    ) as TestableRecipeSubCategoryService;
    recipeSubCategoryRepo = module.get(getRepositoryToken(RecipeSubCategory));

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(subCategoryService).toBeDefined();
  });

  // test createEntity()
  it('should create recipe sub category', async () => {});

  // test updateEntity()
  it('should update recipe sub category', async () => {});

  // test findAll()
  it('should find all recipe sub categories', async () => {});

  // test findAll() with sortBy name
  it('should find all recipe sub categories with sortBy name', async () => {});

  // test findOne()
  it('should find one recipe sub category', async () => {});

  // test findOne() with relations
  it('should find one recipe sub category with relations', async () => {});

  // test remove()
  it('should remove recipe sub category', async () => {});
});
