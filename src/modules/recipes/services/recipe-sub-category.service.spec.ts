import { TestingModule } from '@nestjs/testing';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeSubCategoryService } from './recipe-sub-category.service';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { RecipeCategoryService } from './recipe-category.service';
import { REC_CAT_A, REC_CAT_C, REC_SUBCAT_1 } from '../utils/constants';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import { NotFoundException } from '@nestjs/common';

describe('recipe sub category service', () => {
  let subCategoryService: RecipeSubCategoryService;
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;
  let categoryService: RecipeCategoryService;

  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initRecipeSubCategoryTestingDatabase(dbTestContext);

    subCategoryService = module.get<RecipeSubCategoryService>(RecipeSubCategoryService);
    categoryService = module.get<RecipeCategoryService>(RecipeCategoryService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(subCategoryService).toBeDefined();
  });

  it('should create a sub-category', async () => {
    const catC = await categoryService.findOneByName(REC_CAT_C);
    if(!catC){ throw new Error("recipe category C is null"); }

    const dto = {
      subCategoryName: "test sub Cat",
      parentCategoryId: catC.id,
    } as CreateRecipeSubCategoryDto;

    const result = await subCategoryService.create(dto);
    expect(result).not.toBeNull();
    expect(result?.subCategoryName).toEqual("test sub Cat");
    expect(result?.parentCategory.id).toEqual(catC.id);
    
    testId = result?.id as number;
  });

  it('should update a sub-category', async () => {
    const toUpdate = await subCategoryService.findOne(testId);
    if(!toUpdate){ throw new Error("sub-category to update is null"); }

    const newCat =  await categoryService.findOneByName(REC_CAT_A);
    if(!newCat){ throw new Error("recipe category A not found"); }

    const dto = {
      subCategoryName: "Update Sub Cat Name",
      parentCategoryId: newCat.id,
    } as UpdateRecipeSubCategoryDto;

    const result = await subCategoryService.update(toUpdate.id, dto);
    expect(result).not.toBeNull();
    expect(result?.subCategoryName).toEqual("Update Sub Cat Name");
    expect(result?.parentCategory.id).toEqual(newCat.id);

    const checkOldCat = await categoryService.findOneByName(REC_CAT_C, ["subCategories"]);
    if(!checkOldCat){ throw new Error("old recipe category C not found"); }
    if(!checkOldCat.subCategories){ throw new Error("sub categories is null"); }
    expect(checkOldCat.subCategories.findIndex(s => s.subCategoryName === result?.subCategoryName)).toEqual(-1);

    const checkNewCat = await categoryService.findOneByName(REC_CAT_A, ["subCategories"]);
    if(!checkNewCat){ throw new Error("new recipe category A not found"); }
    if(!checkNewCat.subCategories){ throw new Error("sub categories is null"); }
    expect(checkNewCat.subCategories.findIndex(s => s.subCategoryName === result?.subCategoryName)).not.toEqual(-1);
  });

  it('should remove a sub-category', async () => {
    const removal = await subCategoryService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(subCategoryService.findOne(testId)).rejects.toThrow(NotFoundException);
  });

  it('should get all sub-categories', async () => {
    const expected = await testingUtil.getTestRecipeSubCategoryEntities(dbTestContext);
    const results = await subCategoryService.findAll();
    expect(results.items.length).toEqual(expected.length);

    testIds = [ results.items[0].id, results.items[1].id, results.items[2].id ];
  });

  it('should get sub-categories by a list of ids', async () => {
    const results = await subCategoryService.findEntitiesById(testIds);
    expect(results.length).toEqual(testIds.length);
    for(const result of results){
      expect(testIds.findIndex(id => id === result.id)).not.toEqual(-1);
    }
  });

  it('should get one sub-category by name', async () => {
    const result = await subCategoryService.findOneByName(REC_SUBCAT_1);
    expect(result).not.toBeNull();
    expect(result?.subCategoryName).toEqual(REC_SUBCAT_1);
  });
});
