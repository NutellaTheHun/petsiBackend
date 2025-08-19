import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { CreateOrderCategoryDto } from '../dto/order-category/create-order-category.dto';
import { UpdateOrderCategoryDto } from '../dto/order-category/update-order-category.dto';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderCategoryService } from './order-category.service';

describe('order category service', () => {
  let service: OrderCategoryService;
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let testId: number;
  let testIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getOrdersTestingModule();
    testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
    dbTestContext = new DatabaseTestContext();
    await testingUtil.initOrderCategoryTestDatabase(dbTestContext);

    service = module.get<OrderCategoryService>(OrderCategoryService);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an order type', async () => {
    const dto = {
      categoryName: 'testType',
    } as CreateOrderCategoryDto;

    const result = await service.create(dto);
    expect(result).not.toBeNull();
    expect(result?.categoryName).toEqual('testType');

    testId = result?.id as number;
  });

  it('should find an order type by id', async () => {
    const result = await service.findOne(testId);

    expect(result).not.toBeNull();
    expect(result?.categoryName).toEqual('testType');
    expect(result?.id).toEqual(testId);
  });

  it('should find an order type by name', async () => {
    const result = await service.findOneByName('testType');

    expect(result).not.toBeNull();
    expect(result?.categoryName).toEqual('testType');
    expect(result?.id).toEqual(testId);
  });

  it('should update an order type name', async () => {
    const dto = {
      categoryName: 'updateTestType',
    } as UpdateOrderCategoryDto;

    const result = await service.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.categoryName).toEqual('updateTestType');

    testId = result?.id as number;
  });

  it('should find all order types', async () => {
    const results = await service.findAll();

    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(5);

    testIds = results.items.slice(0, 3).map((type) => type.id);
  });

  it('should sort all order types', async () => {
    const results = await service.findAll({ sortBy: 'categoryName' });

    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(5);
  });

  it('should get order types by list of ids', async () => {
    const results = await service.findEntitiesById(testIds);

    expect(results).not.toBeNull();
    expect(results.length).toEqual(3);
  });

  it('should remove order type', async () => {
    const removal = await service.remove(testId);
    expect(removal).toBeTruthy();

    await expect(service.findOne(testId)).rejects.toThrow(NotFoundException);
  });
});
