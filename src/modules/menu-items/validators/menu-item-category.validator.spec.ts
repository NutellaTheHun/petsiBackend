import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { EXIST } from '../../../util/exceptions/error_constants';
import { ValidationException } from '../../../util/exceptions/validation-exception';
import { CreateMenuItemCategoryDto } from '../dto/menu-item-category/create-menu-item-category.dto';
import { UpdateMenuItemCategoryDto } from '../dto/menu-item-category/update-menu-item-category.dto';
import { MenuItemCategoryService } from '../services/menu-item-category.service';
import { CAT_BLUE, CAT_GREEN, CAT_RED } from '../utils/constants';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemCategoryValidator } from './menu-item-category.validator';

describe('menu item category validator', () => {
  let testingUtil: MenuItemTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: MenuItemCategoryValidator;
  let service: MenuItemCategoryService;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule();
    validator = module.get<MenuItemCategoryValidator>(
      MenuItemCategoryValidator,
    );
    service = module.get<MenuItemCategoryService>(MenuItemCategoryService);

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await testingUtil.initMenuItemCategoryTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const dto = {
      categoryName: 'TEST NAME',
    } as CreateMenuItemCategoryDto;

    await validator.validateCreate(dto);
  });

  it('should fail create (name already exists)', async () => {
    const dto = {
      categoryName: CAT_RED,
    } as CreateMenuItemCategoryDto;

    try {
      await validator.validateCreate(dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(EXIST);
    }
  });

  it('should pass update', async () => {
    const toUpdate = await service.findOneByName(CAT_GREEN);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      categoryName: 'UPDATE TEST',
    } as UpdateMenuItemCategoryDto;

    await validator.validateUpdate(toUpdate.id, dto);
  });

  it('should fail update (name already exists)', async () => {
    const toUpdate = await service.findOneByName(CAT_BLUE);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      categoryName: CAT_RED,
    } as UpdateMenuItemCategoryDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(EXIST);
    }
  });
});
