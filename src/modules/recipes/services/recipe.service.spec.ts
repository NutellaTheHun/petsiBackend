import { NotFoundException } from '@nestjs/common';
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
  let recipeService: TestableRecipeService;
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;
  let recipeRepo: Repository<Recipe>;
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
    dataSource = module.get(DataSource);

    menuItemRepo = module.get(getRepositoryToken(MenuItem));
    menuItemTestUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await menuItemTestUtil.initMenuItemTestDatabase(dbTestContext);

    recipeService = module.get(RecipeService) as TestableRecipeService;
    recipeRepo = module.get(getRepositoryToken(Recipe));
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
  it('should create recipe with NestedCreateRecipeIngredientDtos', async () => {
    const [uom] = await unitOfMeasureRepo.find({ take: 1 });
    const [inv] = await inventoryItemRepo.find({ take: 1 });
    if (!uom || !inv) throw new Error('fixtures not found');

    const dto: CreateRecipeDto = {
      name: 'New Recipe',
      isIngredient: false,
      batchResultUnitTypeId: uom.id,
      servingSizeUnitTypeId: uom.id,
      ingredients: [
        {
          createId: 'i1',
          ingredientInventoryItemId: inv.id,
          quantity: 1,
          quantityUnitTypeId: uom.id,
        },
      ],
    };

    await dataSource.transaction(async (manager) => {
      const result = await recipeService.createEntityForTest(dto, manager);
      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      expect(result.name).toEqual(dto.name);
      expect(result.ingredients).toBeDefined();
      expect(Array.isArray(result.ingredients)).toBe(true);
      expect(result.ingredients?.length ?? 0).toBeGreaterThan(0);
    });
  });

  // test updateEntity() with NestedUpdateRecipeIngredientDto and NestedCreateRecipeIngredientDto
  it('should update recipe with NestedUpdateRecipeIngredientDto and NestedCreateRecipeIngredientDto', async () => {
    const [recipe] = await recipeRepo.find({
      relations: ['ingredients'],
      take: 1,
    });
    const [inv] = await inventoryItemRepo.find({ take: 1 });
    const [uom] = await unitOfMeasureRepo.find({ take: 1 });
    if (!recipe || !inv || !uom) throw new Error('fixtures not found');

    const existing = recipe.ingredients?.[0];
    if (!existing) throw new Error('existing ingredient not found');
    const dto: UpdateRecipeDto = {
      ingredients: [
        { id: existing.id, quantity: 11 },
        {
          createId: 'i2',
          ingredientInventoryItemId: inv.id,
          quantity: 2,
          quantityUnitTypeId: uom.id,
        },
      ],
    };

    await dataSource.transaction(async (manager) => {
      await recipeService.updateEntityForTest(dto, recipe, manager);
    });

    const reloaded = await recipeRepo.findOne({
      where: { id: recipe.id },
      relations: ['ingredients'],
    });
    if (!reloaded) throw new Error('result not found');
    if (existing) {
      const up = reloaded.ingredients!.find((x) => x.id === existing.id);
      expect(up?.quantity).toEqual(11);
    }
    expect(reloaded.ingredients!.length).toBeGreaterThan(0);
  });

  // test findAll()
  it('should find all recipes', async () => {
    const repoResult = await recipeRepo.find();
    const serviceResult = await recipeService.findAll({ limit: 100 });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findAll() with search by recipe name
  it('should find all recipes with search by recipe name', async () => {
    const serviceResult = await recipeService.findAll({
      search: 'recipe',
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(
      serviceResult?.items.every((r) =>
        r.name.toLowerCase().includes('recipe'),
      ),
    ).toBe(true);
  });

  // test findAll() with search by ingredient name
  it('should find all recipes with search by ingredient name', async () => {
    const serviceResult = await recipeService.findAll({
      search: 'food',
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    // expect each recipe to have an ingredient with an inventory item name that includes 'food'
    expect(
      serviceResult?.items.every((r) =>
        r.ingredients?.some((i) =>
          i.ingredientInventoryItem?.name?.toLowerCase().includes('food'),
        ),
      ),
    ).toBe(true);
  });

  // test findAll() with filter by category
  it('should find all recipes with filter by category', async () => {
    const [cat] = await categoryRepo.find({ take: 1 });
    if (!cat) throw new Error('category not found');
    const repoResult = await recipeRepo.find({
      where: { category: { id: cat.id } },
    });
    const serviceResult = await recipeService.findAll({
      filters: [`category=${cat.id}`],
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findAll() with filter by sub category
  it('should find all recipes with filter by sub category', async () => {
    const [sub] = await subCategoryRepo.find({ take: 1 });
    if (!sub) throw new Error('sub category not found');
    const repoResult = await recipeRepo.find({
      where: { subCategory: { id: sub.id } },
    });
    const serviceResult = await recipeService.findAll({
      filters: [`subCategory=${sub.id}`],
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findOne()
  it('should find one recipe', async () => {
    const [r] = await recipeRepo.find({ take: 1 });
    if (!r) throw new Error('recipe not found');

    const serviceResult = await recipeService.findOne(r.id);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(r.id);
  });

  // test findOne() with relations
  it('should find one recipe with relations', async () => {
    const [r] = await recipeRepo.find({ take: 1 });
    if (!r) throw new Error('recipe not found');

    const serviceResult = await recipeService.findOne(r.id, [
      'category',
      'subCategory',
      'ingredients',
    ]);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(r.id);
    expect(Array.isArray(serviceResult?.ingredients)).toBe(true);
  });

  // test remove()
  it('should remove recipe', async () => {
    const r = await recipeRepo.findOne({ where: { name: 'New Recipe' } });
    if (!r) throw new Error('recipe not found (create "New Recipe" first)');
    const id = r.id;

    const deleteResult = await recipeService.remove(id);
    expect(deleteResult).toBe(true);
    await expect(recipeService.findOne(id)).rejects.toThrow(NotFoundException);
  });
});
