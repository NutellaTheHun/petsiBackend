import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { CreateRecipeIngredientDto } from '../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../dto/recipe-ingredient/update-recipe-ingedient.dto';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { Recipe } from '../entities/recipe.entity';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeIngredientService } from './recipe-ingredient.service';

class TestableRecipeIngredientService extends RecipeIngredientService {
  async createEntityForTest(
    dto: CreateRecipeIngredientDto,
    manager: EntityManager,
  ): Promise<RecipeIngredient> {
    return this.createEntity(dto, manager);
  }

  async updateEntityForTest(
    dto: UpdateRecipeIngredientDto,
    entity: RecipeIngredient,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('recipe ingredient service', () => {
  let ingredientService: RecipeIngredientService;
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let recipeRepo: Repository<Recipe>;
  let inventoryItemRepo: Repository<InventoryItem>;
  let unitOfMeasureRepo: Repository<UnitOfMeasure>;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule({
      recipeIngredientServiceClass: TestableRecipeIngredientService,
    });

    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initRecipeIngredientTestingDatabase(dbTestContext);

    ingredientService = module.get(
      RecipeIngredientService,
    ) as TestableRecipeIngredientService;

    recipeRepo = module.get(getRepositoryToken(Recipe));
    inventoryItemRepo = module.get(getRepositoryToken(InventoryItem));
    unitOfMeasureRepo = module.get(getRepositoryToken(UnitOfMeasure));

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(ingredientService).toBeDefined();
  });

  // test createEntity() with ingredientInventoryItemId
  it('should create recipe ingredient with ingredientInventoryItemId', async () => {});

  // test createEntity() with ingredientRecipeId
  it('should create recipe ingredient with ingredientRecipeId', async () => {});

  // test updateEntity()
  it('should update recipe ingredient', async () => {});

  // test updateEntity() with ingredientInventoryItemId
  it('should update recipe ingredient with ingredientInventoryItemId', async () => {});

  // test updateEntity() with ingredientRecipeId
  it('should update recipe ingredient with ingredientRecipeId', async () => {});

  // test findAll()
  it('should find all recipe ingredients', async () => {});

  // test findAll() with sortBy ingredient name
  it('should find all recipe ingredients with search by ingredient name', async () => {});

  // test findOne()
  it('should find one recipe ingredient', async () => {});

  // test findOne() with relations
  it('should find one recipe ingredient with relations', async () => {});

  // test remove()
  it('should remove recipe ingredient', async () => {});
});
