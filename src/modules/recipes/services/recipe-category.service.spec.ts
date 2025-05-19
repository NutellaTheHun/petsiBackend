import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeCategoryService } from './recipe-category.service';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import { CreateChildRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-child-recipe-sub-category.dto';
import { RecipeSubCategoryService } from './recipe-sub-category.service';
import { NotFoundException } from '@nestjs/common';
import { UpdateChildRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-child-recipe-sub-category.dto copy';

describe('recipe category service', () => {
  let categoryService: RecipeCategoryService;
  let testUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;

  let testId: number;
  let testIds: number[];

  let recipeSubCategoryService;
  let testRecSubCatId: number;
  let testSubCatIds: number[];
  let modifiedSubCatId: number;
  let removedSubCatId: number;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    dbTestContext = new DatabaseTestContext();
    testUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    await testUtil.initRecipeCategoryTestingDatabase(dbTestContext);
    await testUtil.initRecipeSubCategoryTestingDatabase(dbTestContext);
    await testUtil.initRecipeTestingDatabase(dbTestContext);
    await testUtil.initRecipeIngredientTestingDatabase(dbTestContext);

    categoryService = module.get<RecipeCategoryService>(RecipeCategoryService);
    recipeSubCategoryService = module.get<RecipeSubCategoryService>(RecipeSubCategoryService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });


  it('should create a recipe category', async () => {
    const result = await categoryService.create({
      categoryName: "testCategory"
    } as CreateRecipeCategoryDto);
    if(!result?.id){ throw new Error("result id is null.")}

    expect(result).not.toBeNull();
    expect(result?.categoryName).toEqual("testCategory");
    expect(result?.id).not.toBeNull();
    
    testId = result?.id;
  });

  it('should find one recipe category by id', async () => {
    const result = await categoryService.findOne(testId);
    expect(result).not.toBeNull();
    expect(result?.categoryName).toEqual("testCategory");
    expect(result?.id).not.toBeNull();
  });

  it('should find a recipe category by name', async () => {
    const result = await categoryService.findOneByName("testCategory");
    expect(result).not.toBeNull();
    expect(result?.categoryName).toEqual("testCategory");
    expect(result?.id).not.toBeNull();
  });
  
  it('should update recipe category name', async () => {
    const toUpdate = await categoryService.findOne(testId);
    if(!toUpdate){ throw new Error("category to update not found"); }

    const updateDto = {
      categoryName: "updatedCategoryName",
    } as UpdateRecipeCategoryDto;

    const result = await categoryService.update(toUpdate.id, updateDto);
    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
  });

  it('should have an updated name', async () => {
    const result = await categoryService.findOne(testId);
    expect(result?.categoryName).toEqual("updatedCategoryName");
  });

  it('should remove a recipe category', async () => {
    const removal = await categoryService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(categoryService.findOne(testId)).rejects.toThrow(NotFoundException);
  });

  it('should find all recipe categories', async () => {
    const expected = await testUtil.getTestRecipeCategoryEntities(dbTestContext);
    const allCategories = await categoryService.findAll();
    expect(allCategories.items.length).toEqual(expected.length)
    testIds = [ allCategories.items[0].id, allCategories.items[1].id ];
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

  it('should create a recipe category with subCategories', async () => {
    const subCatDtoOne = {
      mode: 'create',
      subCategoryName: "subCatOne",
    } as CreateChildRecipeSubCategoryDto;

    const subCatDtoTwo = {
      mode: 'create',
      subCategoryName: "subCatTwo",
    } as CreateChildRecipeSubCategoryDto;

    const subCatDtoThree = {
      mode: 'create',
      subCategoryName: "subCatThree",
    } as CreateChildRecipeSubCategoryDto;

    const createCategoryDto = {
      categoryName: "category with subCats",
      subCategoryDtos: [subCatDtoOne, subCatDtoTwo, subCatDtoThree],
    } as CreateRecipeCategoryDto;

    const result = await categoryService.create(createCategoryDto);
    if(!result){ throw new Error();}
    if(!result.subCategories){ throw new Error();}
    expect(result).not.toBeNull();
    expect(result?.categoryName).toEqual("category with subCats");
    expect(result?.subCategories?.length).toEqual(3);

    testRecSubCatId = result?.id as number;
    testSubCatIds = result.subCategories.map(subCat => subCat.id);
  });

  it('should query the sub-categories', async () => {
    const result = await recipeSubCategoryService.findEntitiesById(testSubCatIds);
    expect(result.length).toEqual(3);
  });

  it('should modify a subCategory', async () => {
    const category = await categoryService.findOne(testRecSubCatId, ['subCategories']);
    if(!category){ throw new NotFoundException(); }
    if(!category.subCategories){ throw new Error(); }

    modifiedSubCatId = category.subCategories[0].id

    const updateSubCatDto = {
      mode: 'update',
      id: modifiedSubCatId,
      subCategoryName: "UPDATED SUBCAT",
    } as UpdateChildRecipeSubCategoryDto;

    const theRest = category.subCategories.slice(1).map(subCat => ({
      mode: 'update',
      id: subCat.id,
    }) as UpdateChildRecipeSubCategoryDto);

    const updateCategoryDto = {
      subCategoryDtos: [updateSubCatDto, ...theRest],
    } as UpdateRecipeCategoryDto;

    const result = await categoryService.update(testRecSubCatId, updateCategoryDto);
    if(!result){ throw new Error(); }
    if(!result.subCategories){ throw new Error(); }

    expect(result).not.toBeNull();
    expect(result.subCategories.length).toEqual(3);
    for(const subCat of result.subCategories){
      if(subCat.id === modifiedSubCatId){
        expect(subCat.subCategoryName).toEqual("UPDATED SUBCAT");
      }
    }
  });

  it('should query modified sub-category', async () => {
    const result = await recipeSubCategoryService.findOne(modifiedSubCatId);
    expect(result.name).toEqual("UPDATED SUBCAT");
  });

  it('should remove a subCategory', async () => {
  const category = await categoryService.findOne(testRecSubCatId, ['subCategories']);
    if(!category){ throw new NotFoundException(); }
    if(!category.subCategories){ throw new Error(); }

    removedSubCatId = category.subCategories[0].id

    const theRest = category.subCategories.slice(1).map(subCat => ({
      mode: 'update',
      id: subCat.id,
    }) as UpdateChildRecipeSubCategoryDto);

    const updateCategoryDto = {
      subCategoryDtos: theRest,
    } as UpdateRecipeCategoryDto;

    const result = await categoryService.update(testRecSubCatId, updateCategoryDto);
    if(!result){ throw new Error(); }
    if(!result.subCategories){ throw new Error(); }
    expect(result).not.toBeNull();
    expect(result.subCategories.length).toEqual(2);
    expect(result.subCategories.findIndex(subCat => subCat.id === removedSubCatId)).toEqual(-1);
  });

  it('should not query the removed subCategory', async () => {
   await expect(recipeSubCategoryService.findOne(removedSubCatId)).rejects.toThrow(NotFoundException);
  });
});
