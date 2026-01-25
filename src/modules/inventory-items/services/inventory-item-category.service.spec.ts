import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/update-inventory-item-category.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { DRYGOOD_CAT } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemCategoryService } from './inventory-item-category.service';

class TestableInventoryItemCategoryService extends InventoryItemCategoryService {
  async createEntityForTest(
    dto: CreateInventoryItemCategoryDto,
    manager: EntityManager,
  ): Promise<InventoryItemCategory> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateInventoryItemCategoryDto,
    entity: InventoryItemCategory,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('Inventory Item Category Service', () => {
  let testingUtil: InventoryItemTestingUtil;
  let service: TestableInventoryItemCategoryService;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;
  let categoryRepo: Repository<InventoryItemCategory>;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule({
      inventoryItemCategoryServiceClass: TestableInventoryItemCategoryService,
    });
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryItemTestingUtil>(
      InventoryItemTestingUtil,
    );
    await testingUtil.initInventoryItemCategoryTestDatabase(dbTestContext);

    service = module.get<InventoryItemCategoryService>(
      InventoryItemCategoryService,
    ) as TestableInventoryItemCategoryService;
    dataSource = module.get(DataSource);
    categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // test createEntity()
  it('should create category', async () => {
    const dto: CreateInventoryItemCategoryDto = { name: 'Produce' };

    await dataSource.transaction(async (manager) => {
      const result = await service.createEntityForTest(dto, manager);

      expect(result).not.toBeNull();
      expect(result?.id).not.toBeNull();
      expect(result.name).toEqual(dto.name);
    });
  });

  // test updateEntity()
  it('should update category', async () => {
    const category = await categoryRepo.findOne({
      where: { name: DRYGOOD_CAT },
    });
    if (!category) throw new Error('category not found');

    const dto: UpdateInventoryItemCategoryDto = { name: 'Dry Goods Updated' };

    await dataSource.transaction(async (manager) => {
      await service.updateEntityForTest(dto, category, manager);
    });

    const result = await categoryRepo.findOne({ where: { id: category.id } });
    if (!result) throw new Error('result not found');
    expect(result.name).toEqual(dto.name);
  });

  // test findAll()
  it('should find all categories', async () => {
    const repoResult = await categoryRepo.find();
    const serviceResult = await service.findAll();
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findall() with sort by name
  it('should find all categories with sort by name', async () => {
    const repoResult = await categoryRepo.find({ order: { name: 'DESC' } });
    const serviceResult = await service.findAll({
      sortBy: 'name',
      sortOrder: 'DESC',
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
    if (repoResult.length > 0) {
      expect(serviceResult?.items[0].name).toEqual(repoResult[0].name);
      const lastIdx = repoResult.length - 1;
      expect(serviceResult?.items[lastIdx].name).toEqual(
        repoResult[lastIdx].name,
      );
    }
  });

  // test findOne()
  it('should find one category', async () => {
    const category = await categoryRepo.find({ take: 1 });
    if (!category.length) throw new Error('category not found');

    const serviceResult = await service.findOne(category[0].id);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(category[0].id);
  });

  // test findOne() with relations
  it('should find one category with relations', async () => {
    const category = await categoryRepo.find({
      take: 1,
      relations: ['inventoryItems'],
    });
    if (!category.length) throw new Error('category not found');

    const serviceResult = await service.findOne(category[0].id, [
      'inventoryItems',
    ]);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(category[0].id);
    expect(serviceResult?.inventoryItems).toBeDefined();
    expect(Array.isArray(serviceResult?.inventoryItems)).toBe(true);
  });

  // test remove()
  it('should remove category', async () => {
    const category = await categoryRepo.find({ take: 1 });
    if (!category.length) throw new Error('category not found');
    const id = category[0].id;

    const deleteResult = await service.remove(id);
    expect(deleteResult).toBe(true);
    await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
  });
});
