import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { getOrdersTestingModule } from '../utils/order-testing.module';
import { OrderTestingUtil } from '../utils/order-testing.util';
import { OrderValidator } from './order.validator';

describe('order validator', () => {
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: OrderValidator;

  let orderRepo: Repository<Order>;
  let categoryRepo: Repository<OrderCategory>;
  let orderItemRepo: Repository<OrderMenuItem>;
  let menuItemRepo: Repository<MenuItem>;

  beforeAll(async () => {
    const module: TestingModule = await getOrdersTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
    await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

    validator = module.get<OrderValidator>(OrderValidator);

    orderRepo = module.get(getRepositoryToken(Order));
    categoryRepo = module.get(getRepositoryToken(OrderCategory));
    orderItemRepo = module.get(getRepositoryToken(OrderMenuItem));
    menuItemRepo = module.get(getRepositoryToken(MenuItem));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // Create Validation Tests
  it('successfully validate create: no validation errors', async () => {});

  it('fail validate create: no ordered items', async () => {});

  it('fail validate create: invalid fulfillment type', async () => {});

  it('fail validate create: order for delivery must have a delivery address', async () => {});

  it('fail validate create: order for delivery must have a phone number', async () => {});

  it('fail validate create: order must have a day of the week selected for fulfillment', async () => {});

  it('fail validate create: invalid weekly fulfillment', async () => {});

  it('fail validate create: duplicate ordered items', async () => {});

  it('fail validate create: nested orderedItems validator errors: contained item not of type single', async () => {});

  it('fail validate create: nested orderedItems validator errors: contained item size not valid', async () => {});

  it('fail validate create: nested orderedItems validator errors: quantity with value 0', async () => {});

  it('fail validate create: nested orderedItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {});

  it('fail validate create: nested orderedItems validator errors: duplicate container item', async () => {});

  it('fail validate create: nested orderedItems validator errors: nested orderContainerItem validator errors: contained item not of type single', async () => {});

  it('fail validate create: nested orderedItems validator errors: nested orderContainerItem validator errors: contained item size not valid', async () => {});

  it('fail validate create: nested orderedItems validator errors: nested orderContainerItem validator errors: quantity with value 0', async () => {});

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {});

  it('fail validate update: no ordered items', async () => {});

  it('fail validate update: invalid fulfillment type', async () => {});

  it('fail validate update: order for delivery must have a delivery address', async () => {});

  it('fail validate update: order for delivery must have a phone number', async () => {});

  it('fail validate update: order must have a day of the week selected for fulfillment', async () => {});

  it('fail validate update: invalid weekly fulfillment', async () => {});

  it('fail validate update: duplicate ordered items', async () => {});

  it('fail validate update: nested orderedItems validator errors: contained item not of type single', async () => {});

  it('fail validate update: nested orderedItems validator errors: contained item size not valid', async () => {});

  it('fail validate update: nested orderedItems validator errors: quantity with value 0', async () => {});

  it('fail validate update: nested orderedItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {});

  it('fail validate update: nested orderedItems validator errors: duplicate container item', async () => {});

  it('fail validate update: nested orderedItems validator errors: nested orderContainerItem validator errors: contained item not of type single', async () => {});

  it('fail validate update: nested orderedItems validator errors: nested orderContainerItem validator errors: contained item size not valid', async () => {});

  it('fail validate update: nested orderedItems validator errors: nested orderContainerItem validator errors: quantity with value 0', async () => {});
});
