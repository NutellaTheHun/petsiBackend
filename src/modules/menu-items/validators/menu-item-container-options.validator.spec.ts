import { NotImplementedException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { CreateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/create-menu-item-container-options.dto';
import { UpdateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/update-menu-item-container-options.dto';
import { NestedMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/nested-menu-item-container-rule.dto';
import { MenuItemContainerOptionsService } from '../services/menu-item-container-options.service';
import { MenuItemService } from '../services/menu-item.service';
import { item_a, item_b, item_c } from '../utils/constants';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemContainerOptionsValidator } from './menu-item-container-options.validator';

describe('menu item container options validator', () => {
  let testingUtil: MenuItemTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: MenuItemContainerOptionsValidator;
  let containerService: MenuItemContainerOptionsService;
  let itemService: MenuItemService;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule();
    validator = module.get<MenuItemContainerOptionsValidator>(
      MenuItemContainerOptionsValidator,
    );
    containerService = module.get<MenuItemContainerOptionsService>(
      MenuItemContainerOptionsService,
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
    const itemA = await itemService.findOneByName(item_a, ['validSizes']);
    if (!itemA) {
      throw new Error();
    }

    const itemB = await itemService.findOneByName(item_b, ['validSizes']);
    if (!itemB) {
      throw new Error();
    }

    const itemC = await itemService.findOneByName(item_c, ['validSizes']);
    if (!itemC) {
      throw new Error();
    }

    const ruleDtos = [
      plainToInstance(NestedMenuItemContainerRuleDto, {
        mode: 'create',
        createDto: {
          validMenuItemId: itemA.id,
          validSizeIds: [itemA.sizes[0].id],
        },
      }),
      plainToInstance(NestedMenuItemContainerRuleDto, {
        mode: 'create',
        createDto: {
          validMenuItemId: itemB.id,
          validSizeIds: [itemB.sizes[0].id],
        },
      }),
    ];
    const dto = {
      parentContainerMenuItemId: itemC.id,
      containerRuleDtos: ruleDtos,
      validQuantity: 3,
    } as CreateMenuItemContainerOptionsDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result);
  });

  it('should fail create: no rules', async () => {
    const itemB = await itemService.findOneByName(item_b, ['validSizes']);
    if (!itemB) {
      throw new Error();
    }

    const dto = {
      parentContainerMenuItemId: itemB.id,
      validQuantity: 3,
    } as CreateMenuItemContainerOptionsDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('containerRules');
  });

  it('should fail create: MenuItemContainerRule Validator', async () => {
    throw new NotImplementedException();
  });

  it('should pass update', async () => {
    const toUpdateRequest = await containerService.findAll({
      relations: ['containerRules'],
    });
    if (!toUpdateRequest) {
      throw new Error();
    }

    const toUpdate = toUpdateRequest.items[0];

    const itemA = await itemService.findOneByName(item_a, ['validSizes']);
    if (!itemA) {
      throw new Error();
    }

    const itemB = await itemService.findOneByName(item_b, ['validSizes']);
    if (!itemB) {
      throw new Error();
    }

    const ruleDtos = [
      plainToInstance(NestedMenuItemContainerRuleDto, {
        mode: 'create',
        createDto: {
          validMenuItemId: itemA.id,
          validSizeIds: [itemA.sizes[0].id],
        },
      }),
      plainToInstance(NestedMenuItemContainerRuleDto, {
        mode: 'update',
        id: toUpdate.containerRules[0].id,
        updateDto: {
          validMenuItemId: itemB.id,
          validSizeIds: [itemB.sizes[0].id],
        },
      }),
    ];

    const dto = {
      containerRuleDtos: ruleDtos,
      validQuantity: 4,
    } as UpdateMenuItemContainerOptionsDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update: MenuItemContainerRule Validator', async () => {
    throw new NotImplementedException();
  });
});
