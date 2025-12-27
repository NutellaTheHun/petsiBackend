import { TestingModule } from '@nestjs/testing';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
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
      validSizeIds: [item.sizes[0].id, item.sizes[0].id],
    } as CreateMenuItemContainerRuleDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
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

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('validSizes');
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
      validSizeIds: [badItem.sizes[0].id, badItem.sizes[1].id],
    } as CreateMenuItemContainerRuleDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('validSizes');
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
      validSizeIds: item.sizes.map((size) => size.id),
    } as UpdateMenuItemContainerRuleDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
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

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('validSizes');
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
      validSizeIds: badItem.sizes.map((size) => size.id),
    } as UpdateMenuItemContainerRuleDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('validSizes');
  });
});
