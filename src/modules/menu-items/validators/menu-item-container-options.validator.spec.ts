import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { DUPLICATE } from '../../../util/exceptions/error_constants';
import { ValidationException } from '../../../util/exceptions/validation-exception';
import { CreateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/create-menu-item-container-options.dto';
import { UpdateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/update-menu-item-container-options.dto';
import { CreateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/create-menu-item-container-rule.dto';
import { NestedMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/nested-menu-item-container-rule.dto';
import { MenuItemContainerOptionsService } from '../services/menu-item-container-options.service';
import { MenuItemService } from '../services/menu-item.service';
import { item_a, item_b } from '../utils/constants';
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

    const ruleDtos = [
      plainToInstance(CreateMenuItemContainerRuleDto, {
        validMenuItemId: itemA.id,
        validSizeIds: [itemA.validSizes[0].id],
      }),
      plainToInstance(CreateMenuItemContainerRuleDto, {
        validMenuItemId: itemB.id,
        validSizeIds: [itemB.validSizes[0].id],
      }),
    ];
    const dto = {
      containerRuleDtos: ruleDtos,
      validQuantity: 3,
    } as CreateMenuItemContainerOptionsDto;

    await validator.validateCreate(dto);
  });

  it('should fail create: duplicate item rules', async () => {
    const itemA = await itemService.findOneByName(item_a, ['validSizes']);
    if (!itemA) {
      throw new Error();
    }

    const itemB = await itemService.findOneByName(item_a, ['validSizes']);
    if (!itemB) {
      throw new Error();
    }

    const ruleDtos = [
      plainToInstance(CreateMenuItemContainerRuleDto, {
        validMenuItemId: itemA.id,
        validSizeIds: [itemA.validSizes[0].id],
      }),
      plainToInstance(CreateMenuItemContainerRuleDto, {
        validMenuItemId: itemB.id,
        validSizeIds: [itemB.validSizes[0].id],
      }),
      plainToInstance(CreateMenuItemContainerRuleDto, {
        validMenuItemId: itemA.id,
        validSizeIds: [itemA.validSizes[1].id],
      }),
    ];

    const dto = {
      containerRuleDtos: ruleDtos,
      validQuantity: 3,
    } as CreateMenuItemContainerOptionsDto;

    try {
      await validator.validateCreate(dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(DUPLICATE);
    }
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
          validSizeIds: [itemA.validSizes[0].id],
        },
      }),
      plainToInstance(NestedMenuItemContainerRuleDto, {
        mode: 'update',
        id: toUpdate.containerRules[0].id,
        updateDto: {
          validMenuItemId: itemB.id,
          validSizeIds: [itemB.validSizes[0].id],
        },
      }),
    ];

    const dto = {
      containerRuleDtos: ruleDtos,
      validQuantity: 4,
    } as UpdateMenuItemContainerOptionsDto;

    await validator.validateUpdate(toUpdate.id, dto);
  });

  it('should fail update: duplicate item rules', async () => {
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

    const itemB = await itemService.findOneByName(item_a, ['validSizes']);
    if (!itemB) {
      throw new Error();
    }

    const ruleDtos = [
      plainToInstance(NestedMenuItemContainerRuleDto, {
        mode: 'create',
        createDto: {
          validMenuItemId: itemA.id,
          validSizeIds: [itemA.validSizes[0].id],
        },
      }),
      plainToInstance(NestedMenuItemContainerRuleDto, {
        mode: 'update',
        id: toUpdate.containerRules[0].id,
        updateDto: {
          validMenuItemId: itemB.id,
          validSizeIds: [itemB.validSizes[0].id],
        },
      }),
      plainToInstance(NestedMenuItemContainerRuleDto, {
        mode: 'update',
        id: toUpdate.containerRules[0].id,
        updateDto: {
          validMenuItemId: itemB.id,
          validSizeIds: [itemB.validSizes[1].id],
        },
      }),
    ];

    const dto = {
      containerRuleDtos: ruleDtos,
      validQuantity: 4,
    } as UpdateMenuItemContainerOptionsDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(DUPLICATE);
    }
  });
});
