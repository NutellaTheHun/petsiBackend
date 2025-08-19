import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { INVALID } from '../../../util/exceptions/error_constants';
import { ValidationException } from '../../../util/exceptions/validation-exception';
import { CreateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/create-menu-item-container-rule.dto';
import { UpdateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/update-menu-item-container-rule.dto';
import { MenuItemContainerRuleService } from '../services/menu-item-container-rule.service';
import { MenuItemService } from '../services/menu-item.service';
import { item_a, item_b, item_f } from '../utils/constants';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemContainerRuleValidator } from './menu-item-container-rule.validator';

describe('menu item container rule validator', () => {
  let testingUtil: MenuItemTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: MenuItemContainerRuleValidator;
  let ruleService: MenuItemContainerRuleService;
  let itemService: MenuItemService;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule();
    validator = module.get<MenuItemContainerRuleValidator>(
      MenuItemContainerRuleValidator,
    );
    ruleService = module.get<MenuItemContainerRuleService>(
      MenuItemContainerRuleService,
    );
    itemService = module.get<MenuItemService>(MenuItemService);

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await testingUtil.initMenuItemContainerTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const item = await itemService.findOneByName(item_a, ['validSizes']);
    if (!item) {
      throw new Error();
    }

    const dto = {
      validMenuItemId: item.id,
      validSizeIds: [item.validSizes[0].id, item.validSizes[0].id],
    } as CreateMenuItemContainerRuleDto;

    await validator.validateCreate(dto);
  });

  it('should fail create: Empty size array', async () => {
    const item = await itemService.findOneByName(item_a, ['validSizes']);
    if (!item) {
      throw new Error();
    }

    const dto = {
      validMenuItemId: item.id,
      validSizeIds: [],
    } as CreateMenuItemContainerRuleDto;

    try {
      await validator.validateCreate(dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(INVALID);
    }
  });

  it('should fail create: invalid sizes', async () => {
    const item = await itemService.findOneByName(item_a, ['validSizes']);
    if (!item) {
      throw new Error();
    }

    const badItem = await itemService.findOneByName(item_b, ['validSizes']);
    if (!badItem) {
      throw new Error();
    }

    const dto = {
      validMenuItemId: item.id,
      validSizeIds: [badItem.validSizes[0].id, badItem.validSizes[1].id],
    } as CreateMenuItemContainerRuleDto;

    try {
      await validator.validateCreate(dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(2);
      expect(error.errors[0].errorType).toEqual(INVALID);
    }
  });

  it('should pass update', async () => {
    const rulesRequest = await ruleService.findAll();
    if (!rulesRequest) {
      throw new Error();
    }

    const toUpdate = rulesRequest.items[0];

    const item = await itemService.findOneByName(item_a, ['validSizes']);
    if (!item) {
      throw new Error();
    }

    const dto = {
      validMenuItemId: item.id,
      validSizeIds: item.validSizes.map((size) => size.id),
    } as UpdateMenuItemContainerRuleDto;

    await validator.validateUpdate(toUpdate.id, dto);
  });

  it('should fail update: empty size array', async () => {
    const rulesRequest = await ruleService.findAll();
    if (!rulesRequest) {
      throw new Error();
    }

    const toUpdate = rulesRequest.items[0];

    const item = await itemService.findOneByName(item_a);
    if (!item) {
      throw new Error();
    }

    const dto = {
      validMenuItemId: item.id,
      validSizeIds: [],
    } as UpdateMenuItemContainerRuleDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(INVALID);
    }
  });

  it('should fail update: invalid sizes', async () => {
    const rulesRequest = await ruleService.findAll();
    if (!rulesRequest) {
      throw new Error();
    }

    const toUpdate = rulesRequest.items[0];

    const item = await itemService.findOneByName(item_a);
    if (!item) {
      throw new Error();
    }

    const badItem = await itemService.findOneByName(item_f, ['validSizes']);
    if (!badItem) {
      throw new Error();
    }

    const dto = {
      validMenuItemId: item.id,
      validSizeIds: badItem.validSizes.map((size) => size.id),
    } as UpdateMenuItemContainerRuleDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(2);
      expect(error.errors[0].errorType).toEqual(INVALID);
    }
  });

  it('should fail update: updating only sizes with invalid sizes', async () => {
    const rulesRequest = await ruleService.findAll({
      relations: ['validItem'],
    });
    if (!rulesRequest) {
      throw new Error();
    }

    const toUpdate = rulesRequest.items[0];

    const badItem = await itemService.findOneByName(item_f, ['validSizes']);
    if (!badItem) {
      throw new Error();
    }

    const dto = {
      validSizeIds: badItem.validSizes.map((size) => size.id),
    } as UpdateMenuItemContainerRuleDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(2);
      expect(error.errors[0].errorType).toEqual(INVALID);
    }
  });
});
