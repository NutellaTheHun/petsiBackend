import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/update-inventory-item-category.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { DAIRY_CAT, DRYGOOD_CAT, FOOD_CAT } from '../utils/constants';
import { getInventoryItemTestingModule } from '../utils/inventory-item-testing-module';
import { InventoryItemTestingUtil } from '../utils/inventory-item-testing.util';
import { InventoryItemCategoryValidator } from './inventory-item-category.validator';

describe('inventory item category validator', () => {
  let testingUtil: InventoryItemTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: InventoryItemCategoryValidator;
  let categoryRepo: Repository<InventoryItemCategory>;

  beforeAll(async () => {
    const module: TestingModule = await getInventoryItemTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<InventoryItemTestingUtil>(
      InventoryItemTestingUtil,
    );
    await testingUtil.initInventoryItemCategoryTestDatabase(dbTestContext);

    validator = module.get<InventoryItemCategoryValidator>(
      InventoryItemCategoryValidator,
    );

    categoryRepo = module.get(getRepositoryToken(InventoryItemCategory));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const dto = {
      name: 'CREATE TEST',
    } as CreateInventoryItemCategoryDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create (name already exists)', async () => {
    const dto = {
      name: FOOD_CAT,
    } as CreateInventoryItemCategoryDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('categoryName');
  });

  it('should validate update', async () => {
    const toUpdate = await service.findOneByName(DRYGOOD_CAT);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      name: 'UPDATE TEST',
    } as UpdateInventoryItemCategoryDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update (name already exists)', async () => {
    const toUpdate = await service.findOneByName(DRYGOOD_CAT);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      name: DAIRY_CAT,
    } as UpdateInventoryItemCategoryDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('categoryName');
  });
});
