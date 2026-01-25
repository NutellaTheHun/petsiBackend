import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { UpdateInventoryAreaDto } from '../dto/inventory-area/update-inventory-area.dto';
import { InventoryArea } from '../entities/inventory-area.entity';
import { AREA_A } from '../utils/constants';
import { InventoryAreaTestUtil } from '../utils/inventory-area-test.util';
import { getInventoryAreasTestingModule } from '../utils/inventory-areas-testing.module';
import { InventoryAreaService } from './inventory-area.service';

class TestableInventoryAreaService extends InventoryAreaService {
  async createEntityForTest(
    dto: CreateInventoryAreaDto,
    manager: EntityManager,
  ) {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateInventoryAreaDto,
    entity: InventoryArea,
    manager: EntityManager,
  ) {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('Inventory area service', () => {
  let testingUtil: InventoryAreaTestUtil;
  let dbTestContext: DatabaseTestContext;
  let service: TestableInventoryAreaService;
  let dataSource: DataSource;
  let inventoryAreaRepo: Repository<InventoryArea>;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryAreasTestingModule({
      areaServiceClass: TestableInventoryAreaService,
    });

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryAreaTestUtil>(InventoryAreaTestUtil);
    await testingUtil.initInventoryAreaTestDatabase(dbTestContext);

    service = module.get(InventoryAreaService) as TestableInventoryAreaService;
    dataSource = module.get(DataSource);
    inventoryAreaRepo = module.get(getRepositoryToken(InventoryArea));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // test createEntity()
  it('should create area', async () => {
    const dto: CreateInventoryAreaDto = { name: 'Area E' };

    await dataSource.transaction(async (manager) => {
      const result = await service.createEntityForTest(dto, manager);

      expect(result).not.toBeNull();
      expect(result?.id).not.toBeNull();
      expect(result.name).toEqual(dto.name);
    });
  });

  // test updateEntity()
  it('should update area', async () => {
    const area = await inventoryAreaRepo.findOne({
      where: { name: AREA_A },
    });
    if (!area) throw new Error('area not found');

    const dto: UpdateInventoryAreaDto = { name: 'Area A Updated' };

    await dataSource.transaction(async (manager) => {
      await service.updateEntityForTest(dto, area, manager);
    });

    const result = await inventoryAreaRepo.findOne({
      where: { id: area.id },
    });
    if (!result) throw new Error('result not found');
    expect(result.name).toEqual(dto.name);
  });

  // test findAll()
  it('should find all areas', async () => {
    const repoResult = await inventoryAreaRepo.find();
    const serviceResult = await service.findAll();
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.items.length).toEqual(repoResult.length);
  });

  // test findall() with sort by name
  it('should find all areas with sort by name', async () => {
    const repoResult = await inventoryAreaRepo.find({
      order: { name: 'DESC' },
    });
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
  it('should find one area', async () => {
    const area = await inventoryAreaRepo.find({ take: 1 });
    if (!area.length) throw new Error('area not found');

    const serviceResult = await service.findOne(area[0].id);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(area[0].id);
  });

  // test findOne() with relations
  it('should find one area with relations', async () => {
    const area = await inventoryAreaRepo.find({
      take: 1,
      relations: ['inventoryCounts'],
    });
    if (!area.length) throw new Error('area not found');

    const serviceResult = await service.findOne(area[0].id, [
      'inventoryCounts',
    ]);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(area[0].id);
    expect(serviceResult?.inventoryCounts).toBeDefined();
    expect(Array.isArray(serviceResult?.inventoryCounts)).toBe(true);
  });

  // test remove()
  it('should remove area', async () => {
    const area = await inventoryAreaRepo.find({ take: 1 });
    if (!area.length) throw new Error('area not found');
    const id = area[0].id;

    const deleteResult = await service.remove(id);
    expect(deleteResult).toBe(true);
    await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
  });
});
