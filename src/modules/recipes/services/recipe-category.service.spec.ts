import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { REC_CAT_A } from '../utils/constants';
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
  let categoryService: TestableRecipeCategoryService;
  let testUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let categoryRepo: Repository<RecipeCategory>;

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
    categoryRepo = module.get(getRepositoryToken(RecipeCategory));

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  // test createEntity() with NestedCreateRecipeSubCategoryDtos
  it('should create category', async () => {
    const dto: CreateRecipeCategoryDto = {
      name: 'Pies',
    };

    await dataSource.transaction(async (manager) => {
      const result = await categoryService.createEntityForTest(dto, manager);
      expect(result).not.toBeNull();
      expect(result.id).toBeDefined();
      expect(result.name).toEqual(dto.name);
    });
  });

  // test createEntity() with multiple NestedCreateRecipeSubCategoryDtos
  it('should create category with  NestedCreateRecipeSubCategoryDtos', async () => {
    const dto: CreateRecipeCategoryDto = {
      name: 'Pastries',
      subCategories: [
        { createId: 'c1', name: 'A' },
        { createId: 'c2', name: 'B' },
      ],
    };

    await dataSource.transaction(async (manager) => {
      const result = await categoryService.createEntityForTest(dto, manager);
      expect(result).not.toBeNull();
      expect(result.subCategories?.length).toBe(2);
      expect(result.subCategories?.map((s) => s.name).sort()).toEqual([
        'A',
        'B',
      ]);
    });
  });

  // test updateEntity()
  it('should update category', async () => {
    const cat = await categoryRepo.findOne({ where: { name: REC_CAT_A } });
    if (!cat) throw new Error('category not found');

    const dto: UpdateRecipeCategoryDto = { name: 'Updated Category A' };

    await dataSource.transaction(async (manager) => {
      await categoryService.updateEntityForTest(dto, cat, manager);
    });

    const updated = await categoryRepo.findOne({ where: { id: cat.id } });
    if (!updated) throw new Error('result not found');
    expect(updated.name).toEqual(dto.name);
  });

  // test updateEntity() with NestedUpdateRecipeSubCategoryDto and NestedCreateRecipeSubCategoryDto
  it('should update category with NestedUpdateRecipeSubCategoryDto and NestedCreateRecipeIngredientDto', async () => {
    const cat = await categoryRepo.findOne({
      where: { name: 'Updated Category A' },
      relations: ['subCategories'],
    });
    if (!cat?.subCategories?.length)
      throw new Error('category with subCategories not found');
    const existing = cat.subCategories[0];

    const dto: UpdateRecipeCategoryDto = {
      subCategories: [
        { id: existing.id, name: 'Updated Sub' },
        { createId: 'c2', name: 'New Sub' },
      ],
    };

    await dataSource.transaction(async (manager) => {
      await categoryService.updateEntityForTest(dto, cat, manager);
    });

    const updated = await categoryRepo.findOne({
      where: { id: cat.id },
      relations: ['subCategories'],
    });
    if (!updated) throw new Error('result not found');
    const updatedSub = updated.subCategories?.find((s) => s.id === existing.id);
    expect(updatedSub?.name).toEqual('Updated Sub');
    const newSub = updated.subCategories?.find((s) => s.name === 'New Sub');
    expect(newSub).toBeDefined();
    expect(newSub?.id).toBeDefined();
  });

  // test findAll()
  it('should find all categories', async () => {
    const repoResult = await categoryRepo.find();
    const serviceResult = await categoryService.findAll({ limit: 100 });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findAll() sortBy name (category name; supported by applySortBy)
  it('should find all categories with sortBy name', async () => {
    const repoResult = await categoryRepo.find({ order: { name: 'DESC' } });
    const serviceResult = await categoryService.findAll({
      sortBy: 'name',
      sortOrder: 'DESC',
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
    if (repoResult.length > 0) {
      expect(serviceResult?.items[0].name).toEqual(repoResult[0].name);
    }
  });

  // test findOne()
  it('should find one category', async () => {
    const [cat] = await categoryRepo.find({ take: 1 });
    if (!cat) throw new Error('category not found');
    const serviceResult = await categoryService.findOne(cat.id);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(cat.id);
  });

  // test findOne() with relations
  it('should find one category with relations', async () => {
    const [cat] = await categoryRepo.find({ take: 1 });
    if (!cat) throw new Error('category not found');
    const serviceResult = await categoryService.findOne(cat.id, [
      'subCategories',
      'recipes',
    ]);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(cat.id);
    expect(serviceResult?.subCategories).toBeDefined();
    expect(Array.isArray(serviceResult?.subCategories)).toBe(true);
    expect(serviceResult?.recipes).toBeDefined();
    expect(Array.isArray(serviceResult?.recipes)).toBe(true);
  });

  // test remove()
  it('should remove category', async () => {
    let id: number;
    await dataSource.transaction(async (manager) => {
      const created = await (
        categoryService as TestableRecipeCategoryService
      ).createEntityForTest({ name: 'Category To Remove' }, manager);
      id = created.id;
    });
    const deleteResult = await categoryService.remove(id!);
    expect(deleteResult).toBe(true);
    await expect(categoryService.findOne(id!)).rejects.toThrow(
      NotFoundException,
    );
  });
});
