import { TestingModule } from '@nestjs/testing';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeCategoryService } from './recipe-category.service';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { RecipeCategoryBuilder } from '../builders/recipe-category.builder';
import { CreateRecipeCategoryDto } from '../dto/create-recipe-category.dto';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';

describe('recipe category service', () => {
  let categoryService: RecipeCategoryService;
  let testUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;
  let categoryBuilder: RecipeCategoryBuilder;

  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    dbTestContext = new DatabaseTestContext();
    testUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    await testUtil.initRecipeCategoryTestingDatabase(dbTestContext);
    await testUtil.initRecipeSubCategoryTestingDatabase(dbTestContext);
    await testUtil.initRecipeTestingDatabase(dbTestContext);
    await testUtil.initRecipeIngredientTestingDatabase(dbTestContext);

    categoryService = module.get<RecipeCategoryService>(RecipeCategoryService);
    categoryBuilder = module.get<RecipeCategoryBuilder>(RecipeCategoryBuilder);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });


  it('should create a recipe category', async () => {
    const result = await categoryService.create({
      name: "testCategory"
    } as CreateRecipeCategoryDto);
    if(!result?.id){ throw new Error("result id is null.")}

    expect(result).not.toBeNull();
    expect(result?.name).toEqual("testCategory");
    expect(result?.id).not.toBeNull();
    
    testId = result?.id;
  });

  it('should find one recipe category by id', async () => {
    const result = await categoryService.findOne(testId);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("testCategory");
    expect(result?.id).not.toBeNull();
  });

  it('should find a recipe category by name', async () => {
    const result = await categoryService.findOneByName("testCategory");
    expect(result).not.toBeNull();
    expect(result?.name).toEqual("testCategory");
    expect(result?.id).not.toBeNull();
  });
  
  it('should update a recipe category', async () => {
    const toUpdate = await categoryService.findOne(testId);
    if(!toUpdate){ throw new Error("category to update not found"); }

    const updateDto = {
      name: "updatedCategoryName",
    }

    const result = await categoryService.update(toUpdate.id, updateDto);
    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
  });

  it('should have an updated name', async () => {
    const result = await categoryService.findOne(testId);
    expect(result?.name).toEqual("updatedCategoryName");
  });

  it('should remove a recipe category', async () => {
    const removal = await categoryService.remove(testId);
    expect(removal).toBeTruthy();

    const verify = await categoryService.findOne(testId);
    expect(verify).toBeNull();
  });

  it('should find all recipe categories', async () => {
    const expected = await testUtil.getTestRecipeCategoryEntities(dbTestContext);
    const allCategories = await categoryService.findAll();
    expect(allCategories.length).toEqual(expected.length)
    testIds = [ allCategories[0].id, allCategories[1].id ];
  });

  it('should find recipes by list of ids', async () => {
    const results = await categoryService.findEntitiesById(testIds);
    expect(results.length).toEqual(2);
  });

  it('should find recipe categories with sub categories', async () => {
    const result = await categoryService.findOne(testIds[0], ["subCategories"]);
    if(!result){ throw new Error("category is null"); }

    expect(result.subCategories).not.toBeNull();
    expect(result.subCategories?.length).toBeGreaterThan(0);
  });

  it('should find recipes categories with recipes', async () => {
    const result = await categoryService.findOne(testIds[0], ["recipes"]);
    if(!result){ throw new Error("category is null"); }

    expect(result.recipes).not.toBeNull();
    expect(result.recipes.length).toBeGreaterThan(0);
  });
});
