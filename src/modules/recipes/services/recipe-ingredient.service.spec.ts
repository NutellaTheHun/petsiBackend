import { NotFoundException } from '@nestjs/common';
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
  let ingredientService: TestableRecipeIngredientService;
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;
  let ingredientRepo: Repository<RecipeIngredient>;
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

    ingredientService = module.get(RecipeIngredientService) as TestableRecipeIngredientService;
    ingredientRepo = module.get(getRepositoryToken(RecipeIngredient));
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
  it('should create recipe ingredient with ingredientInventoryItemId', async () => {
    const [parent] = await recipeRepo.find({ take: 1 });
    const [inv] = await inventoryItemRepo.find({ take: 1 });
    const [uom] = await unitOfMeasureRepo.find({ take: 1 });
    if (!parent || !inv || !uom) throw new Error('fixtures not found');
    const dto: CreateRecipeIngredientDto = {
      parentRecipeId: parent.id,
      ingredientInventoryItemId: inv.id,
      quantity: 1.5,
      quantityUnitTypeId: uom.id,
    };

    await dataSource.transaction(async (manager) => {
      const result = await ingredientService.createEntityForTest(dto, manager);
      const saved = await manager.save(result);
      expect(saved).not.toBeNull();
      expect(saved?.id).toBeDefined();
      expect(saved.quantity).toEqual(dto.quantity);
    });
  });

  // test createEntity() with ingredientRecipeId
  it('should create recipe ingredient with ingredientRecipeId', async () => {
    const recipes = await recipeRepo.find({ take: 2 });
    const [uom] = await unitOfMeasureRepo.find({ take: 1 });
    if (recipes.length < 2 || !uom) throw new Error('fixtures not found');
    const dto: CreateRecipeIngredientDto = {
      parentRecipeId: recipes[0].id,
      ingredientRecipeId: recipes[1].id,
      quantity: 2,
      quantityUnitTypeId: uom.id,
    };

    await dataSource.transaction(async (manager) => {
      const result = await ingredientService.createEntityForTest(dto, manager);
      const saved = await manager.save(result);
      expect(saved).not.toBeNull();
      expect(saved?.id).toBeDefined();
      expect(saved.quantity).toEqual(dto.quantity);
    });
  });

  // test updateEntity()
  it('should update recipe ingredient', async () => {
    const [existing] = await ingredientRepo.find({ take: 1 });
    if (!existing) throw new Error('ingredient not found');
    const dto: UpdateRecipeIngredientDto = { quantity: 99 };

    await dataSource.transaction(async (manager) => {
      await ingredientService.updateEntityForTest(dto, existing, manager);
      await manager.save(existing);
    });

    const result = await ingredientRepo.findOne({ where: { id: existing.id } });
    if (!result) throw new Error('result not found');
    expect(result.quantity).toEqual(dto.quantity);
  });

  // test updateEntity() with ingredientInventoryItemId
  it('should update recipe ingredient with ingredientInventoryItemId', async () => {
    const [ing] = await ingredientRepo.find({
      take: 1,
      relations: ['ingredientRecipe', 'ingredientInventoryItem'],
    });
    const [inv] = await inventoryItemRepo.find({ take: 1 });
    if (!ing || !inv) throw new Error('fixtures not found');
    const dto: UpdateRecipeIngredientDto = { ingredientInventoryItemId: inv.id };

    await dataSource.transaction(async (manager) => {
      await ingredientService.updateEntityForTest(dto, ing, manager);
      await manager.save(ing);
    });

    const result = await ingredientRepo.findOne({
      where: { id: ing.id },
      relations: ['ingredientInventoryItem'],
    });
    if (!result) throw new Error('result not found');
    expect(result.ingredientInventoryItem?.id).toEqual(inv.id);
  });

  // test updateEntity() with ingredientRecipeId
  it('should update recipe ingredient with ingredientRecipeId', async () => {
    const [ing] = await ingredientRepo.find({
      take: 1,
      relations: ['ingredientInventoryItem', 'ingredientRecipe'],
    });
    const [recipe] = await recipeRepo.find({ take: 1 });
    if (!ing || !recipe) throw new Error('fixtures not found');
    const dto: UpdateRecipeIngredientDto = { ingredientRecipeId: recipe.id };

    await dataSource.transaction(async (manager) => {
      await ingredientService.updateEntityForTest(dto, ing, manager);
      await manager.save(ing);
    });

    const result = await ingredientRepo.findOne({
      where: { id: ing.id },
      relations: ['ingredientRecipe'],
    });
    if (!result) throw new Error('result not found');
    expect(result.ingredientRecipe?.id).toEqual(recipe.id);
  });

  // test findAll()
  it('should find all recipe ingredients', async () => {
    const repoResult = await ingredientRepo.find();
    const serviceResult = await ingredientService.findAll({ limit: 100 });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findAll() with sortBy ingredient
  it('should find all recipe ingredients with sortBy ingredient name', async () => {
    const serviceResult = await ingredientService.findAll({
      sortBy: 'ingredient',
      sortOrder: 'DESC',
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toBeGreaterThan(0);
  });

  // test findOne()
  it('should find one recipe ingredient', async () => {
    const [ing] = await ingredientRepo.find({ take: 1 });
    if (!ing) throw new Error('ingredient not found');

    const serviceResult = await ingredientService.findOne(ing.id);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(ing.id);
  });

  // test findOne() with relations
  it('should find one recipe ingredient with relations', async () => {
    const [ing] = await ingredientRepo.find({ take: 1 });
    if (!ing) throw new Error('ingredient not found');

    const serviceResult = await ingredientService.findOne(ing.id, [
      'parentRecipe',
      'ingredientInventoryItem',
      'ingredientRecipe',
      'quantityUnitType',
    ]);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(ing.id);
    expect(serviceResult?.parentRecipe).toBeDefined();
    expect(serviceResult?.quantityUnitType).toBeDefined();
  });

  // test remove()
  it('should remove recipe ingredient', async () => {
    const [ing] = await ingredientRepo.find({ take: 1 });
    if (!ing) throw new Error('ingredient not found');
    const id = ing.id;

    const deleteResult = await ingredientService.remove(id);
    expect(deleteResult).toBe(true);
    await expect(ingredientService.findOne(id)).rejects.toThrow(NotFoundException);
  });
});
