import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import { NestedCreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/nested-create-recipe-sub-category.dto';
import { NestedUpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/nested-update-recipe-sub-category.dto';
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

  it('should create a recipe category', async () => {
    const result = await categoryService.create({
      name: 'testCategory',
    } as CreateRecipeCategoryDto);
    if (!result?.id) {
      throw new Error('result id is null.');
    }

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('testCategory');
    expect(result?.id).not.toBeNull();

    testId = result?.id;
  });

  it('should find one recipe category by id', async () => {
    const result = await categoryService.findOne(testId);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual('testCategory');
    expect(result?.id).not.toBeNull();
  });

  it('should find a recipe category by name', async () => {
    const result = await categoryService.findOneByName('testCategory');
    expect(result).not.toBeNull();
    expect(result?.name).toEqual('testCategory');
    expect(result?.id).not.toBeNull();
  });

  it('should update recipe category name', async () => {
    const toUpdate = await categoryService.findOne(testId);
    if (!toUpdate) {
      throw new Error('category to update not found');
    }

    const updateDto = {
      name: 'updatedCategoryName',
    } as UpdateRecipeCategoryDto;

    const result = await categoryService.update(toUpdate.id, updateDto);
    expect(result).not.toBeNull();
    expect(result?.id).not.toBeNull();
  });

  it('should have an updated name', async () => {
    const result = await categoryService.findOne(testId);
    expect(result?.name).toEqual('updatedCategoryName');
  });

  it('should remove a recipe category', async () => {
    const removal = await categoryService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(categoryService.findOne(testId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should find all recipe categories', async () => {
    const expected =
      await testUtil.getTestRecipeCategoryEntities(dbTestContext);
    const allCategories = await categoryService.findAll();
    expect(allCategories.items.length).toEqual(expected.length);
    testIds = [allCategories.items[0].id, allCategories.items[1].id];
  });

  it('should sort all recipe categories', async () => {
    const expected =
      await testUtil.getTestRecipeCategoryEntities(dbTestContext);
    const allCategories = await categoryService.findAll({
      sortBy: 'categoryName',
    });
    expect(allCategories.items.length).toEqual(expected.length);
  });

  it('should find recipes by list of ids', async () => {
    const results = await categoryService.findEntitiesById(testIds);
    expect(results.length).toEqual(2);
  });

  it('should find recipe categories with sub categories', async () => {
    const result = await categoryService.findOne(testIds[0], ['subCategories']);
    if (!result) {
      throw new Error('category is null');
    }

    expect(result.subCategories).not.toBeNull();
    expect(result.subCategories?.length).toBeGreaterThan(0);
  });

  it('should find recipes categories with recipes', async () => {
    const result = await categoryService.findOne(testIds[0], ['recipes']);
    if (!result) {
      throw new Error('category is null');
    }

    expect(result.recipes).not.toBeNull();
    expect(result.recipes.length).toBeGreaterThan(0);
  });

  it('should create a recipe category with subCategories', async () => {
    const subCatDtoOne = plainToInstance(NestedCreateRecipeSubCategoryDto, {
      createId: 'c1',
      name: 'subCatOne',
    });

    const subCatDtoTwo = plainToInstance(NestedCreateRecipeSubCategoryDto, {
      createId: 'c2',
      name: 'subCatTwo',
    });

    const subCatDtoThree = plainToInstance(NestedCreateRecipeSubCategoryDto, {
      createId: 'c3',
      name: 'subCatThree',
    });

    const createCategoryDto = {
      name: 'category with subCats',
      subCategories: [subCatDtoOne, subCatDtoTwo, subCatDtoThree],
    } as CreateRecipeCategoryDto;

    const result = await categoryService.create(createCategoryDto);
    if (!result) {
      throw new Error();
    }
    if (!result.subCategories) {
      throw new Error();
    }
    expect(result).not.toBeNull();
    expect(result?.name).toEqual('category with subCats');
    expect(result?.subCategories?.length).toEqual(3);

    testRecSubCatId = result?.id as number;
    testSubCatIds = result.subCategories.map((subCat) => subCat.id);
  });

  it('should query the sub-categories', async () => {
    const result =
      await recipeSubCategoryService.findEntitiesById(testSubCatIds);
    expect(result.length).toEqual(3);
  });

  it('should modify a subCategory', async () => {
    const category = await categoryService.findOne(testRecSubCatId, [
      'subCategories',
    ]);
    if (!category) {
      throw new NotFoundException();
    }
    if (!category.subCategories) {
      throw new Error();
    }

    modifiedSubCatId = category.subCategories[0].id;

    const updateSubCatDto = plainToInstance(NestedUpdateRecipeSubCategoryDto, {
      id: modifiedSubCatId,
      name: 'UPDATED SUBCAT',
    });

    const theRest = category.subCategories.slice(1).map((subCat) =>
      plainToInstance(NestedUpdateRecipeSubCategoryDto, {
        id: subCat.id,
      }),
    );

    const updateCategoryDto = {
      subCategoryDtos: [updateSubCatDto, ...theRest],
    } as UpdateRecipeCategoryDto;

    const result = await categoryService.update(
      testRecSubCatId,
      updateCategoryDto,
    );
    if (!result) {
      throw new Error();
    }
    if (!result.subCategories) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    expect(result.subCategories.length).toEqual(3);
    for (const subCat of result.subCategories) {
      if (subCat.id === modifiedSubCatId) {
        expect(subCat.name).toEqual('UPDATED SUBCAT');
      }
    }
  });
});
