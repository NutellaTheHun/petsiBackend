import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { REC_CAT_A, REC_SUBCAT_1 } from '../utils/constants';
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
  let subCategoryService: TestableRecipeSubCategoryService;
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let recipeSubCategoryRepo: Repository<RecipeSubCategory>;
  let categoryRepo: Repository<RecipeCategory>;

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
    categoryRepo = module.get(getRepositoryToken(RecipeCategory));

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(subCategoryService).toBeDefined();
  });

  // test createEntity()
  it('should create recipe sub category', async () => {
    const parent = await categoryRepo.findOne({ where: { name: REC_CAT_A } });
    if (!parent) throw new Error('parent category not found');
    const dto: CreateRecipeSubCategoryDto = {
      name: 'Sweet Pie',
      parentCategoryId: parent.id,
    };

    await dataSource.transaction(async (manager) => {
      const result = await subCategoryService.createEntityForTest(dto, manager);
      const saved = await manager.save(result);
      expect(saved).not.toBeNull();
      expect(saved?.id).toBeDefined();
      expect(saved.name).toEqual(dto.name);
    });
  });

  // test updateEntity()
  it('should update recipe sub category', async () => {
    const sub = await recipeSubCategoryRepo.findOne({
      where: { name: REC_SUBCAT_1 },
    });
    if (!sub) throw new Error('sub category not found');

    const dto: UpdateRecipeSubCategoryDto = { name: 'Sub Cat 1 Updated' };

    await dataSource.transaction(async (manager) => {
      await subCategoryService.updateEntityForTest(dto, sub, manager);
      await manager.save(sub);
    });

    const result = await recipeSubCategoryRepo.findOne({ where: { id: sub.id } });
    if (!result) throw new Error('result not found');
    expect(result.name).toEqual(dto.name);
  });

  // test findAll()
  it('should find all recipe sub categories', async () => {
    const repoResult = await recipeSubCategoryRepo.find();
    const serviceResult = await subCategoryService.findAll();
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findAll() with sortBy name
  it('should find all recipe sub categories with sortBy name', async () => {
    const repoResult = await recipeSubCategoryRepo.find({
      order: { name: 'DESC' },
    });
    const serviceResult = await subCategoryService.findAll({
      sortBy: 'name',
      sortOrder: 'DESC',
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
    if (repoResult.length > 0) {
      expect(serviceResult?.items[0].name).toEqual(repoResult[0].name);
    }
  });

  // test findOne()
  it('should find one recipe sub category', async () => {
    const sub = await recipeSubCategoryRepo.find({ take: 1 });
    if (!sub.length) throw new Error('sub category not found');

    const serviceResult = await subCategoryService.findOne(sub[0].id);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(sub[0].id);
  });

  // test findOne() with relations
  it('should find one recipe sub category with relations', async () => {
    const sub = await recipeSubCategoryRepo.find({ take: 1 });
    if (!sub.length) throw new Error('sub category not found');

    const serviceResult = await subCategoryService.findOne(sub[0].id, [
      'parentCategory',
      'recipes',
    ]);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(sub[0].id);
    expect(serviceResult?.parentCategory).toBeDefined();
    expect(serviceResult?.recipes).toBeDefined();
    expect(Array.isArray(serviceResult?.recipes)).toBe(true);
  });

  // test remove()
  it('should remove recipe sub category', async () => {
    const sub = await recipeSubCategoryRepo.find({ take: 1 });
    if (!sub.length) throw new Error('sub category not found');
    const id = sub[0].id;

    const deleteResult = await subCategoryService.remove(id);
    expect(deleteResult).toBe(true);
    await expect(subCategoryService.findOne(id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
