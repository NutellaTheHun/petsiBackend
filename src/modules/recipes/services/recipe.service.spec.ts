import { TestingModule } from '@nestjs/testing';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeService } from './recipe.service';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { InventoryItemTestingUtil } from '../../inventory-items/utils/inventory-item-testing.util';

describe('recipe service', () => {
  let service: RecipeService;
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
    dbTestContext = new DatabaseTestContext();

    service = module.get<RecipeService>(RecipeService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // create
  it('should create a recipe', async () => {

  });
  // update
  it('should update a recipe', async () => {

  });
  // findAll
  it('should get all recipes', async () => {

  });
  // findOne
  it('should get one recipe', async () => {

  });
  // findEntitiesById
  it('should get recipes by list of ids', async () => {

  });
  // remove
  it('should remove a recipe', async () => {

  });
  // findOneByName
  it('should find a recipe by name', async () => {

  });
});
