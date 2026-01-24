import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe } from '../entities/recipe.entity';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeService } from './recipe.service';

class TestableRecipeService extends RecipeService {
  async createEntityForTest(
    dto: CreateRecipeDto,
    manager: EntityManager,
  ): Promise<Recipe> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateRecipeDto,
    entity: Recipe,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('recipe service', () => {
  let recipeService: RecipeService;
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let categoryRepo: Repository<RecipeCategory>;
  let subCategoryRepo: Repository<RecipeSubCategory>;
  let ingredientRepo: Repository<RecipeIngredient>;

  let unitOfMeasureRepo: Repository<UnitOfMeasure>;

  let inventoryItemRepo: Repository<InventoryItem>;

  let menuItemRepo: Repository<MenuItem>;
  let menuItemTestUtil: MenuItemTestingUtil;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule({
      recipeServiceClass: TestableRecipeService,
    });
    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    dbTestContext = new DatabaseTestContext();
    //await testingUtil.initRecipeTestingDatabase(dbTestContext);
    await testingUtil.initRecipeIngredientTestingDatabase(dbTestContext);

    menuItemRepo = module.get(getRepositoryToken(MenuItem));
    menuItemTestUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await menuItemTestUtil.initMenuItemTestDatabase(dbTestContext);

    recipeService = module.get(RecipeService) as TestableRecipeService;
    categoryRepo = module.get(getRepositoryToken(RecipeCategory));
    subCategoryRepo = module.get(getRepositoryToken(RecipeSubCategory));
    ingredientRepo = module.get(getRepositoryToken(RecipeIngredient));
    unitOfMeasureRepo = module.get(getRepositoryToken(UnitOfMeasure));
    inventoryItemRepo = module.get(getRepositoryToken(InventoryItem));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(recipeService).toBeDefined();
  });

  // test createEntity() with NestedCreateRecipeIngredientDtos
  it('should create recipe with NestedCreateRecipeIngredientDtos', async () => {});

  // test updateEntity() with NestedUpdateRecipeIngredientDto and NestedCreateRecipeIngredientDto
  it('should update recipe with NestedUpdateRecipeIngredientDto and NestedCreateRecipeIngredientDto', async () => {});

  // test findAll()
  it('should find all recipes', async () => {});

  // test findAll() with search by recipe name
  it('should find all recipes with search by recipe name', async () => {});

  // test findAll() with search by ingredient name
  it('should find all recipes with search by ingredient name', async () => {});

  // test findAll() with filter by category
  it('should find all recipes with filter by category', async () => {});

  // test findAll() with filter by sub category
  it('should find all recipes with filter by sub category', async () => {});

  // test findOne()
  it('should find one recipe', async () => {});

  // test findOne() with relations
  it('should find one recipe with relations', async () => {});

  // test remove()
  it('should remove recipe', async () => {});
});
