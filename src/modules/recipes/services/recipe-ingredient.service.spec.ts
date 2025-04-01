import { TestingModule } from '@nestjs/testing';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeIngredientService } from './recipe-ingredient.service';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { InventoryItemTestingUtil } from '../../inventory-items/utils/inventory-item-testing.util';

describe('recipe ingredient service', () => {
  let service: RecipeIngredientService;
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    
    testingUtil = module.get<InventoryItemTestingUtil>(InventoryItemTestingUtil);
    dbTestContext = new DatabaseTestContext();

    service = module.get<RecipeIngredientService>(RecipeIngredientService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // create
  it('should create an ingredient', async () => {

  });
  // update
  it('should update an ingredient', async () => {

  });
  // findAll
  it('should get all ingredients', async () => {

  });
  // findOne
  it('should get one ingredient by id', async () => {

  });
  // findEntitiesById
  it('should get ingredients by list of ids', async () => {

  });
  // remove
  it('should remove an ingredient', async () => {

  });
  // findByRecipeName
  it('should get a list of ingredients by recipe name', async () => {

  });
  // findByInventoryItemName
  it('should get a list of ingredients by inventoryItemName?', async () => {

  });
});
