import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { REC_CAT_A, REC_CAT_C, REC_SUBCAT_1 } from '../utils/constants';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeSubCategoryService } from './recipe-sub-category.service';

class TestableRecipeSubCategoryService extends RecipeSubCategoryService {
  async createEntityForTest(
    dto: CreateRecipeSubCategoryDto,
    manager: EntityManager,
  ): Promise<RecipeSubCategory> {
    return this.createEntity(dto, manager);
  }

  async updateEntityForTest(
    dto: UpdateRecipeSubCategoryDto,
    entity: RecipeSubCategory,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('recipe sub category service', () => {
  let subCategoryService: RecipeSubCategoryService;
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let recipeSubCategoryRepo: Repository<RecipeSubCategory>;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule({
      recipeSubCategoryServiceClass: TestableRecipeSubCategoryService,
    });
    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initRecipeSubCategoryTestingDatabase(dbTestContext);

    subCategoryService = module.get<RecipeSubCategoryService>(
      RecipeSubCategoryService,
    ) as TestableRecipeSubCategoryService;
    recipeSubCategoryRepo = module.get(getRepositoryToken(RecipeSubCategory));

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(subCategoryService).toBeDefined();
  });

  it('should fail to create a sub-category (Bad request) then create properly for future tests', async () => {
    const catC = await categoryService.findOneByName(REC_CAT_C);
    if (!catC) {
      throw new Error('recipe category C is null');
    }

    /*const dto = {
      subCategoryName: 'test sub Cat',
      parentCategoryId: catC.id,
    } as CreateRecipeSubCategoryDto;

    await expect(subCategoryService.create(dto)).rejects.toThrow(
      BadRequestException,
    );*/

    /*const createSubCatDto = plainToInstance(NestedRecipeSubCategoryDto, {
      mode: 'create',
      createDto: {
        subCategoryName: 'test sub Cat',
      },
    });*/
    const createSubCatDto = {
      parentCategoryId: catC.id,
      name: 'test sub Cat',
    } as CreateRecipeSubCategoryDto;

    const createResult = await subCategoryService.create(createSubCatDto);
    if (!createResult) {
      throw new Error();
    }

    expect(createResult).not.toBeNull();
    expect(createResult?.name).toEqual('test sub Cat');
    expect(createResult?.parentCategory.id).toEqual(catC.id);

    testId = createResult?.id as number;
  });

  it('should update a sub-category', async () => {
    const toUpdate = await subCategoryService.findOne(testId);
    if (!toUpdate) {
      throw new Error('sub-category to update is null');
    }

    const newCat = await categoryService.findOneByName(REC_CAT_A);
    if (!newCat) {
      throw new Error('recipe category A not found');
    }

    const dto = {
      name: 'Update Sub Cat Name',
    } as UpdateRecipeSubCategoryDto;

    const result = await subCategoryService.update(toUpdate.id, dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual('Update Sub Cat Name');
  });

  it('should remove a sub-category', async () => {
    const removal = await subCategoryService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(subCategoryService.findOne(testId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should get all sub-categories', async () => {
    const expected =
      await testingUtil.getTestRecipeSubCategoryEntities(dbTestContext);
    const results = await subCategoryService.findAll();
    expect(results.items.length).toEqual(expected.length);

    testIds = [results.items[0].id, results.items[1].id, results.items[2].id];
  });

  it('should sort all sub-categories', async () => {
    const expected =
      await testingUtil.getTestRecipeSubCategoryEntities(dbTestContext);
    const results = await subCategoryService.findAll({
      sortBy: 'subCategoryName',
    });
    expect(results.items.length).toEqual(expected.length);
  });

  it('should get sub-categories by a list of ids', async () => {
    const results = await subCategoryService.findEntitiesById(testIds);
    expect(results.length).toEqual(testIds.length);
    for (const result of results) {
      expect(testIds.findIndex((id) => id === result.id)).not.toEqual(-1);
    }
  });

  it('should get one sub-category by name', async () => {
    const result = await subCategoryService.findOneByName(REC_SUBCAT_1);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual(REC_SUBCAT_1);
  });
});
