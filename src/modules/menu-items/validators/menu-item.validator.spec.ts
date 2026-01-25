import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemValidator } from './menu-item.validator';

describe('menu item validator', () => {
  let testingUtil: MenuItemTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let validator: MenuItemValidator;
  let itemRepo: Repository<MenuItem>;
  let categoryRepo: Repository<MenuItemCategory>;
  let sizeRepo: Repository<MenuItemSize>;
  let itemContainerRepo: Repository<MenuItemContainerItem>;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await testingUtil.initMenuItemContainerItemTestDatabase(dbTestContext);

    validator = module.get<MenuItemValidator>(MenuItemValidator);

    itemRepo = module.get(getRepositoryToken(MenuItem));
    categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
    sizeRepo = module.get(getRepositoryToken(MenuItemSize));
    itemContainerRepo = module.get(getRepositoryToken(MenuItemContainerItem));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // Create Validation Tests
  it('successfully validate create: no validation errors', async () => {});

  it('fail validate create: name already exists', async () => {});

  it('fail validate create: containerMenuItems and not set to type container', async () => {});

  it('fail validate create: containerMenuItems errors: duplicate container item', async () => {});

  it('fail validate create: nested containerMenuItems validator errors: contained item not of type single', async () => {});

  it('fail validate create: nested containerMenuItems validator errors: contained item size not valid', async () => {});

  it('fail validate create: nested containerMenuItems validator errors: quantity with value 0', async () => {});

  // Update Validation Tests
  it('successfully validate update with no validation errors', async () => {});

  it('fail validate update: name already exists', async () => {});

  it('fail validate update: containerMenuItems and not set to type container', async () => {});

  it('fail validate update: containerMenuItems errors: duplicate container item', async () => {});

  it('fail validate update: nested containerMenuItems validator errors: contained item not of type single', async () => {});

  it('fail validate update: nested containerMenuItems validator errors: contained item size not valid', async () => {});

  it('fail validate update: nested containerMenuItems validator errors: quantity with value 0', async () => {});

  it('fail validate update: nested containerMenuItems validator errors: parent with variable max amount and quantity not equal to variable max amount', async () => {});
});
