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
import { OrderContainerItemValidator } from './order-container-item.validator';

describe('order container item validator', () => {
  let testingUtil: OrderTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: OrderContainerItemValidator;
  let containerItemRepo: Repository<OrderContainerItem>;
  let orderItemRepo: Repository<OrderMenuItem>;
  let menuItemRepo: Repository<MenuItem>;
  let sizeRepo: Repository<MenuItemSize>;

  beforeAll(async () => {
    const module: TestingModule = await getOrdersTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
    await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

    validator = module.get<OrderContainerItemValidator>(
      OrderContainerItemValidator,
    );

    containerItemRepo = module.get(getRepositoryToken(OrderContainerItem));
    orderItemRepo = module.get(getRepositoryToken(OrderMenuItem));
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

  it('fail validate create: contained item not of type single', async () => {});

  it('fail validate create: invalid contained item size', async () => {});

  it('fail validate create: quantity with value 0', async () => {});

  it('fail validate create: parent menu item cannot be equal to contained menu item', async () => {});

  it('fail validate create: parent item not of type container', async () => {});

  it('fail validate create: invalid parent item size', async () => {});

  it('fail validate create: invalid containedItem and size for parent container', async () => {});

  it('fail validate create: parent with variable max amount and quantity not equal to variable max amount', async () => {});

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {});

  it('fail validate update: contained item not of type single', async () => {});

  it('fail validate update: invalid contained item size', async () => {});

  it('fail validate update: quantity with value 0', async () => {});

  it('fail validate update: parent menu item cannot be equal to contained menu item', async () => {});

  it('fail validate update: invalid containedItem and size for parent container', async () => {});

  it('fail validate update: parent with variable max amount and quantity not equal to variable max amount', async () => {});
});
