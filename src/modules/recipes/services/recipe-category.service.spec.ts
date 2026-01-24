import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeCategoryService } from './recipe-category.service';

class TestableRecipeCategoryService extends RecipeCategoryService {
  async createEntityForTest(
    dto: CreateRecipeCategoryDto,
    manager: EntityManager,
  ): Promise<RecipeCategory> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateRecipeCategoryDto,
    entity: RecipeCategory,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('recipe category service', () => {
  let categoryService: RecipeCategoryService;
  let testUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let recipeSubCategoryRepo: Repository<RecipeSubCategory>;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule({
      recipeCategoryServiceClass: TestableRecipeCategoryService,
    });

    dbTestContext = new DatabaseTestContext();
    testUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    await testUtil.initRecipeCategoryTestingDatabase(dbTestContext);
    await testUtil.initRecipeSubCategoryTestingDatabase(dbTestContext);
    await testUtil.initRecipeTestingDatabase(dbTestContext);
    await testUtil.initRecipeIngredientTestingDatabase(dbTestContext);

    categoryService = module.get(
      RecipeCategoryService,
    ) as TestableRecipeCategoryService;
    recipeSubCategoryRepo = module.get(getRepositoryToken(RecipeSubCategory));

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  // test createEntity() with NestedCreateRecipeIngredientDtos
  it('should create category with NestedCreateRecipeIngredientDtos', async () => {});

  // test createEntity() with NestedCreateRecipeIngredientDtos and NestedCreateRecipeSubCategoryDtos
  it('should create category with NestedCreateRecipeIngredientDtos and NestedCreateRecipeSubCategoryDtos', async () => {});

  // test updateEntity()
  it('should update category', async () => {});

  // test updateEntity() with NestedUpdateRecipeIngredientDto and NestedCreateRecipeIngredientDto
  it('should update category with NestedUpdateRecipeIngredientDto and NestedCreateRecipeIngredientDto', async () => {});

  // test updateEntity() with NestedUpdateRecipeIngredientDto and NestedCreateRecipeIngredientDto and NestedUpdateRecipeSubCategoryDto and NestedCreateRecipeSubCategoryDto
  it('should update category with NestedUpdateRecipeIngredientDto and NestedCreateRecipeIngredientDto and NestedUpdateRecipeSubCategoryDto and NestedCreateRecipeSubCategoryDto', async () => {});

  // test findAll()
  it('should find all categories', async () => {});

  // test findAll() with search by ingredient name
  it('should find all categories with search by ingredient name', async () => {});

  // test findAll() with search by subCategory name
  it('should find all categories with search by subCategory name', async () => {});

  // test findAll() with search by inventory item name
  it('should find all categories with filter by inventory item name', async () => {});

  // test findAll() with filter by category name
  it('should find all categories with filter by category name', async () => {});

  // test findAll() with filter by sub category name
  it('should find all categories with filter by sub category name', async () => {});

  // test findAll() sortBy recipe name
  it('should find all categories with sortBy name', async () => {});

  // test findAll() sortBy category name
  it('should find all categories with sortBy category name', async () => {});

  // test findAll() sortBy sub category name
  it('should find all categories with sortBy sub category name', async () => {});

  // test findOne()
  it('should find one category', async () => {});

  // test findOne() with relations
  it('should find one category with relations', async () => {});

  // test remove()
  it('should remove category', async () => {});
});
