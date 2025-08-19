import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { EXIST } from '../../../util/exceptions/error_constants';
import { ValidationException } from '../../../util/exceptions/validation-exception';
import { CreateMenuItemSizeDto } from '../dto/menu-item-size/create-menu-item-size.dto';
import { UpdateMenuItemSizeDto } from '../dto/menu-item-size/update-menu-item-size.dto';
import { MenuItemSizeService } from '../services/menu-item-size.service';
import { SIZE_FOUR, SIZE_ONE, SIZE_TWO } from '../utils/constants';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemSizeValidator } from './menu-item-size.validator';

describe('menu item size validator', () => {
  let testingUtil: MenuItemTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: MenuItemSizeValidator;
  let service: MenuItemSizeService;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule();
    validator = module.get<MenuItemSizeValidator>(MenuItemSizeValidator);
    service = module.get<MenuItemSizeService>(MenuItemSizeService);

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await testingUtil.initMenuItemSizeTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const dto = {
      sizeName: 'TEST CREATE',
    } as CreateMenuItemSizeDto;

    await validator.validateCreate(dto);
  });

  it('should fail create (name already exists)', async () => {
    const dto = {
      sizeName: SIZE_TWO,
    } as CreateMenuItemSizeDto;

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
    const toUpdate = await service.findOneByName(SIZE_FOUR);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      sizeName: 'TEST UPDATE',
    } as UpdateMenuItemSizeDto;

    await validator.validateUpdate(toUpdate.id, dto);
  });

  it('should fail update (name already exists)', async () => {
    const toUpdate = await service.findOneByName(SIZE_FOUR);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      sizeName: SIZE_ONE,
    } as UpdateMenuItemSizeDto;

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
