import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemContainerItemValidator } from './menu-item-container-item.validator';

describe('menu item container item validator', () => {
  let testingUtil: MenuItemTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let validator: MenuItemContainerItemValidator;
  let containerItemRepo: Repository<MenuItemContainerItem>;
  let itemRepo: Repository<MenuItem>;
  let sizeRepo: Repository<MenuItemSize>;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await testingUtil.initMenuItemContainerItemTestDatabase(dbTestContext);

    validator = module.get<MenuItemContainerItemValidator>(
      MenuItemContainerItemValidator,
    );

    containerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
    itemRepo = module.get(getRepositoryToken(MenuItem));
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

  it('fail validate create: parent with variable max amount and quantity not equal to variable max amount', async () => {});

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {});

  it('fail validate update: contained item not of type single', async () => {});

  it('fail validate update: invalid contained item size (dto with itemSizeId, pre-existing contained item)', async () => {});

  it('fail validate update: invalid contained item size (dto with itemSizeId, and containedItemId)', async () => {});

  it('fail validate update: quantity with value 0', async () => {});

  it('fail validate update: parent menu item cannot be equal to contained menu item', async () => {});

  it('fail validate update: containedItemId item not of type single', async () => {});

  it('fail validate update: parent with variable max amount and quantity not equal to variable max amount', async () => {});
});
