import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderMenuItemValidator } from './order-menu-item.validator';

describe('order category validator', () => {
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: OrderMenuItemValidator;
  let orderItemRepo: Repository<OrderMenuItem>;
  let orderContainerItemRepo: Repository<OrderContainerItem>;
  let menuItemRepo: Repository<MenuItem>;
  let sizeRepo: Repository<MenuItemSize>;

  beforeAll(async () => {
    const module: TestingModule = await getOrdersTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
    await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

    validator = module.get<OrderMenuItemValidator>(OrderMenuItemValidator);

    orderItemRepo = module.get(getRepositoryToken(OrderMenuItem));
    orderContainerItemRepo = module.get(getRepositoryToken(OrderContainerItem));
    menuItemRepo = module.get(getRepositoryToken(MenuItem));
    sizeRepo = module.get(getRepositoryToken(MenuItemSize));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // Create Validation Tests
  it('successfully validate create: no validation errors', async () => {});

  it('fail validate create: invalid size', async () => {});

  it('fail validate create: container must have at least one item', async () => {});

  it('fail validate create: duplicate container item', async () => {});

  it('fail validate create: container quantity not equal to variable max amount', async () => {});

  it('fail validate create: nested containerOrderMenuItems validator errors: contained item not of type single', async () => {});

  it('fail validate create: nested containerOrderMenuItems validator errors: contained item size not valid', async () => {});

  it('fail validate create: nested containerOrderMenuItems validator errors: quantity with value 0', async () => {});

  it('fail validate create: nested containerOrderMenuItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {});

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {});

  it('fail validate update: invalid size', async () => {});

  it('fail validate update: container must have at least one item', async () => {});

  it('fail validate update: duplicate container item', async () => {});

  it('fail validate update: container quantity not equal to variable max amount', async () => {});

  it('fail validate update: nested containerOrderMenuItems validator errors: contained item not of type single', async () => {});

  it('fail validate update: nested containerOrderMenuItems validator errors: contained item size not valid', async () => {});

  it('fail validate update: nested containerOrderMenuItems validator errors: quantity with value 0', async () => {});

  it('fail validate update: nested containerOrderMenuItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {});
});
