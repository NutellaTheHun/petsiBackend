import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationMessage } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemSizeDto } from '../dto/menu-item-size/create-menu-item-size.dto';
import { UpdateMenuItemSizeDto } from '../dto/menu-item-size/update-menu-item-size.dto';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { SIZE_ONE } from '../utils/constants';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemSizeValidator } from './menu-item-size.validator';

describe('menu item size validator', () => {
  let testingUtil: MenuItemTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let validator: MenuItemSizeValidator;
  let sizeRepo: Repository<MenuItemSize>;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await testingUtil.initMenuItemSizeTestDatabase(dbTestContext);

    validator = module.get<MenuItemSizeValidator>(MenuItemSizeValidator);

    sizeRepo = module.get(getRepositoryToken(MenuItemSize));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // Create Validation Tests
  it('successfully validate create: no validation errors', async () => {
    const dto: CreateMenuItemSizeDto = {
      name: 'New Size Name',
    };

    const errors = await validator.validateCreateNode(dto);
    expect(errors).toBeNull();
  });

  it('fail validate create: name already exists', async () => {
    const dto: CreateMenuItemSizeDto = {
      name: SIZE_ONE,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'name' }],
      'Menu item size already exists.',
    );
  });

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {
    const sizeToUpdate = await sizeRepo.findOne({ where: { name: SIZE_ONE } });
    if (!sizeToUpdate) {
      throw new Error('size not found');
    }

    const dto: UpdateMenuItemSizeDto = {
      name: 'Updated Size Name',
    };

    const errors = await validator.validateUpdateNode(dto, sizeToUpdate.id);
    expect(errors).toBeNull();
  });

  it('fail validate update: name already exists', async () => {
    const sizes = await sizeRepo.find();
    if (sizes.length < 2) {
      throw new Error('Not enough sizes for test');
    }

    const sizeToUpdate = sizes[0];
    const existingSize = sizes[1];

    const dto: UpdateMenuItemSizeDto = {
      name: existingSize.name,
    };

    const errors = await validator.validateUpdateNode(dto, sizeToUpdate.id);
    expectValidationMessage(
      errors,
      [{ prop: 'name' }],
      'Menu item size already exists.',
    );
  });
});
