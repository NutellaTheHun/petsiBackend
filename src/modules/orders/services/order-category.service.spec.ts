import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateOrderCategoryDto } from '../dto/order-category/create-order-category.dto';
import { UpdateOrderCategoryDto } from '../dto/order-category/update-order-category.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { TYPE_A } from '../utils/constants';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderCategoryService } from './order-category.service';

class TestableOrderCategoryService extends OrderCategoryService {
  async createEntityForTest(
    dto: CreateOrderCategoryDto,
    manager: EntityManager,
  ): Promise<OrderCategory> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateOrderCategoryDto,
    entity: OrderCategory,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('order category service', () => {
  let service: TestableOrderCategoryService;
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;
  let categoryRepo: Repository<OrderCategory>;

  beforeAll(async () => {
    const module: TestingModule = await getOrdersTestingModule({
      orderCategoryServiceClass: TestableOrderCategoryService,
    });
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
    await testingUtil.initOrderCategoryTestDatabase(dbTestContext);
    dataSource = module.get(DataSource);
    service = module.get(OrderCategoryService) as TestableOrderCategoryService;
    categoryRepo = module.get(getRepositoryToken(OrderCategory));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // test createEntity()
  it('should create category', async () => {
    const dto: CreateOrderCategoryDto = { name: 'Wholesale' };

    await dataSource.transaction(async (manager) => {
      const result = await service.createEntityForTest(dto, manager);

      expect(result).not.toBeNull();
      expect(result?.id).not.toBeNull();
      expect(result.name).toEqual(dto.name);
    });
  });

  // test updateEntity()
  it('should update category', async () => {
    const cat = await categoryRepo.findOne({ where: { name: TYPE_A } });
    if (!cat) throw new Error('category not found');

    const dto: UpdateOrderCategoryDto = { name: 'Type A Updated' };

    await dataSource.transaction(async (manager) => {
      await service.updateEntityForTest(dto, cat, manager);
    });

    const result = await categoryRepo.findOne({ where: { id: cat.id } });
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

  // test findAll)() with sortByName
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
    }
  });

  // test findOne()
  it('should find one category', async () => {
    const cat = await categoryRepo.find({ take: 1 });
    if (!cat.length) throw new Error('category not found');

    const serviceResult = await service.findOne(cat[0].id);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(cat[0].id);
  });

  // test findOne() with relations
  it('should find one category with relations', async () => {
    const cat = await categoryRepo.find({
      take: 1,
      relations: ['orders'],
    });
    if (!cat.length) throw new Error('category not found');

    const serviceResult = await service.findOne(cat[0].id, ['orders']);
    expect(serviceResult).not.toBeNull();
    expect(serviceResult?.id).toEqual(cat[0].id);
    expect(serviceResult?.orders).toBeDefined();
    expect(Array.isArray(serviceResult?.orders)).toBe(true);
  });

  // test remove()
  it('should remove category', async () => {
    const cat = await categoryRepo.find({ take: 1 });
    if (!cat.length) throw new Error('category not found');
    const id = cat[0].id;

    const deleteResult = await service.remove(id);
    expect(deleteResult).toBe(true);
    await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
  });
});
