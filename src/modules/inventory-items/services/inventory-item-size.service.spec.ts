import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { UnitOfMeasureCategory } from '../../unit-of-measure/entities/unit-of-measure-category.entity';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemSizeService } from './inventory-item-size.service';

class TestableInventoryItemSizeService extends InventoryItemSizeService {
  async createEntityForTest(
    dto: CreateInventoryItemSizeDto,
    manager: EntityManager,
  ): Promise<InventoryItemSize> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateInventoryItemSizeDto,
    entity: InventoryItemSize,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('Inventory Item Size Service', () => {
  let module: TestingModule;
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let sizeService: TestableInventoryItemSizeService;
  let dataSource: DataSource;

  let unitRepo: Repository<UnitOfMeasure>;
  let unitCategoryRepo: Repository<UnitOfMeasureCategory>;
  let packageRepo: Repository<InventoryItemPackage>;
  let itemRepo: Repository<InventoryItem>;
  let sizeRepo: Repository<InventoryItemSize>;

  beforeAll(async () => {
    module = await getInventoryItemTestingModule({
      inventoryItemSizeServiceClass: TestableInventoryItemSizeService,
    });
    dbTestContext = new DatabaseTestContext();

    testingUtil = module.get<InventoryItemTestingUtil>(
      InventoryItemTestingUtil,
    );
    await testingUtil.initInventoryItemSizeTestDatabase(dbTestContext);

    sizeService = module.get(
      InventoryItemSizeService,
    ) as TestableInventoryItemSizeService;

    dataSource = module.get(DataSource);

    packageRepo = module.get(getRepositoryToken(InventoryItemPackage));
    unitCategoryRepo = module.get(getRepositoryToken(UnitOfMeasureCategory));
    itemRepo = module.get(getRepositoryToken(InventoryItem));
    unitRepo = module.get(getRepositoryToken(UnitOfMeasure));
    sizeRepo = module.get(getRepositoryToken(InventoryItemSize));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(sizeService).toBeDefined();
  });

  // test createEntity()
  it('should create size', async () => {
    const item = await itemRepo.findOne({ where: {} });
    const pkg = await packageRepo.findOne({ where: {} });
    const unit = await unitRepo.findOne({ where: {} });
    if (!item || !pkg || !unit) throw new Error('item, package, or unit not found');

    const dto: CreateInventoryItemSizeDto = {
      inventoryItemId: item.id,
      packageId: pkg.id,
      measureTypeId: unit.id,
      measureAmount: 5,
      cost: 12.5,
    };

    await dataSource.transaction(async (manager) => {
      const result = await sizeService.createEntityForTest(dto, manager);

      expect(result).not.toBeNull();
      expect(result?.id).not.toBeNull();
      expect(result.measureAmount).toEqual(5);
      expect(Number(result.cost)).toEqual(12.5);
    });
  });

  // test updateEntity()
  it('should update size', async () => {
    const size = await sizeRepo.findOne({ where: {} });
    if (!size) throw new Error('size not found');

    const dto: UpdateInventoryItemSizeDto = { cost: 25.99 };

    await dataSource.transaction(async (manager) => {
      await sizeService.updateEntityForTest(dto, size, manager);
      await manager.save(size);
    });

    const result = await sizeRepo.findOne({ where: { id: size.id } });
    if (!result) throw new Error('result not found');
    expect(Number(result.cost)).toEqual(25.99);
  });

  // test findAll()
  it('should find all sizes', async () => {
    const repoResult = await sizeRepo.find();
    const serviceResult = await sizeService.findAll({ limit: 100 });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findall() with sort by cost
  it('should find all sizes with sort by cost', async () => {
    const repoResult = await sizeRepo.find({ order: { cost: 'DESC' } });
    const serviceResult = await sizeService.findAll({
      sortBy: 'cost',
      sortOrder: 'DESC',
      limit: 100,
    });
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
    if (repoResult.length > 0) {
      expect(Number(serviceResult?.items[0].cost)).toEqual(
        Number(repoResult[0].cost),
      );
    }
  });

  // test findOne()
  it('should find one size', async () => {
    const size = await sizeRepo.find({ take: 1 });
    if (!size.length) throw new Error('size not found');

    const serviceResult = await sizeService.findOne(size[0].id);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(size[0].id);
  });

  // test findOne() with relations
  it('should find one size with relations', async () => {
    const size = await sizeRepo.find({
      take: 1,
      relations: ['inventoryItem', 'package', 'measureType'],
    });
    if (!size.length) throw new Error('size not found');

    const serviceResult = await sizeService.findOne(size[0].id, [
      'inventoryItem',
      'package',
      'measureType',
    ]);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(size[0].id);
    expect(serviceResult?.inventoryItem).toBeDefined();
    expect(serviceResult?.package).toBeDefined();
    expect(serviceResult?.measureType).toBeDefined();
  });

  // test remove()
  it('should remove size', async () => {
    const size = await sizeRepo.find({ take: 1 });
    if (!size.length) throw new Error('size not found');
    const id = size[0].id;

    const deleteResult = await sizeService.remove(id);
    expect(deleteResult).toBe(true);
    await expect(sizeService.findOne(id)).rejects.toThrow(NotFoundException);
  });
});
