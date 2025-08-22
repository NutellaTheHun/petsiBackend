import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { DUPLICATE, EXIST } from '../../../util/exceptions/error_constants';
import { ValidationException } from '../../../util/exceptions/validation-exception';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { item_a, item_b, item_c } from '../../menu-items/utils/constants';
import { NestedTemplateMenuItemDto } from '../dto/template-menu-item/nested-template-menu-item.dto copy';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { TemplateService } from '../services/template.service';
import { template_a, template_b } from '../utils/constants';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateValidator } from './template.validator';

describe('template validator', () => {
  let testingUtil: TemplateTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: TemplateValidator;
  let templateService: TemplateService;
  let menuItemService: MenuItemService;

  beforeAll(async () => {
    const module: TestingModule = await getTemplateTestingModule();
    validator = module.get<TemplateValidator>(TemplateValidator);

    templateService = module.get<TemplateService>(TemplateService);
    menuItemService = module.get<MenuItemService>(MenuItemService);

    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
    await testingUtil.initTemplateMenuItemTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const itemA = await menuItemService.findOneByName(item_a);
    if (!itemA) {
      throw new Error();
    }
    const itemB = await menuItemService.findOneByName(item_b);
    if (!itemB) {
      throw new Error();
    }

    const itemDtos = [
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'create',
        createDto: {
          displayName: 'A',
          menuItemId: itemA.id,
          tablePosIndex: 1,
        },
      }),
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'create',
        createDto: {
          displayName: 'B',
          menuItemId: itemB.id,
          tablePosIndex: 2,
        },
      }),
    ];
    const dto = {
      templateName: 'CREATE',
      isPie: true,
      templateItemDtos: itemDtos,
    } as CreateTemplateDto;

    await validator.validateCreate(dto);
  });

  it('should fail create: duplicate menuItems', async () => {
    const itemA = await menuItemService.findOneByName(item_a);
    if (!itemA) {
      throw new Error();
    }
    const itemB = await menuItemService.findOneByName(item_b);
    if (!itemB) {
      throw new Error();
    }

    const itemDtos = [
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'create',
        createDto: {
          displayName: 'A',
          menuItemId: itemA.id,
          tablePosIndex: 1,
        },
      }),
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'create',
        createDto: {
          displayName: 'B',
          menuItemId: itemB.id,
          tablePosIndex: 2,
        },
      }),
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'create',
        createDto: {
          displayName: 'A2',
          menuItemId: itemA.id,
          tablePosIndex: 3,
        },
      }),
    ];

    const dto = {
      templateName: 'CREATE',
      isPie: true,
      templateItemDtos: itemDtos,
    } as CreateTemplateDto;

    try {
      await validator.validateCreate(dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(DUPLICATE);
    }
  });

  it('should fail create: duplicate TablePosIndex', async () => {
    const itemA = await menuItemService.findOneByName(item_a);
    if (!itemA) {
      throw new Error();
    }
    const itemB = await menuItemService.findOneByName(item_b);
    if (!itemB) {
      throw new Error();
    }
    const itemC = await menuItemService.findOneByName(item_c);
    if (!itemC) {
      throw new Error();
    }

    const itemDtos = [
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'create',
        createDto: {
          displayName: 'A',
          menuItemId: itemA.id,
          tablePosIndex: 1,
        },
      }),
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'create',
        createDto: {
          displayName: 'B',
          menuItemId: itemB.id,
          tablePosIndex: 2,
        },
      }),
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'create',
        createDto: {
          displayName: 'A2',
          menuItemId: itemC.id,
          tablePosIndex: 1,
        },
      }),
    ];

    const dto = {
      templateName: 'CREATE',
      isPie: true,
      templateItemDtos: itemDtos,
    } as CreateTemplateDto;

    try {
      await validator.validateCreate(dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(DUPLICATE);
    }
  });

  it('should fail create: Name exists', async () => {
    const itemA = await menuItemService.findOneByName(item_a);
    if (!itemA) {
      throw new Error();
    }
    const itemB = await menuItemService.findOneByName(item_b);
    if (!itemB) {
      throw new Error();
    }

    const itemDtos = [
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'create',
        createDto: {
          displayName: 'A',
          menuItemId: itemA.id,
          tablePosIndex: 1,
        },
      }),
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'create',
        createDto: {
          displayName: 'B',
          menuItemId: itemB.id,
          tablePosIndex: 2,
        },
      }),
    ];
    const dto = {
      templateName: template_a,
      isPie: true,
      templateItemDtos: itemDtos,
    } as CreateTemplateDto;

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
    const toUpdate = await templateService.findOneByName(template_a, [
      'templateItems',
    ]);
    if (!toUpdate) {
      throw new Error();
    }

    const itemA = await menuItemService.findOneByName(item_a);
    if (!itemA) {
      throw new Error();
    }
    const itemB = await menuItemService.findOneByName(item_b);
    if (!itemB) {
      throw new Error();
    }

    const itemDtos = [
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'create',
        createDto: {
          displayName: 'A',
          menuItemId: itemA.id,
          tablePosIndex: 1,
        },
      }),
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'update',
        id: toUpdate.templateItems[0].id,
        updateDto: {
          displayName: 'B',
          menuItemId: itemB.id,
          tablePosIndex: 2,
        },
      }),
    ];

    const dto = {
      templateName: 'UPDATE',
      isPie: true,
      templateItemDtos: itemDtos,
    } as UpdateTemplateDto;

    await validator.validateUpdate(toUpdate.id, dto);
  });

  it('should fail update: duplicate menuItems', async () => {
    const toUpdate = await templateService.findOneByName(template_a, [
      'templateItems',
    ]);
    if (!toUpdate) {
      throw new Error();
    }

    const itemA = await menuItemService.findOneByName(item_a);
    if (!itemA) {
      throw new Error();
    }
    const itemB = await menuItemService.findOneByName(item_b);
    if (!itemB) {
      throw new Error();
    }

    const itemDtos = [
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'create',
        createDto: {
          displayName: 'A',
          menuItemId: itemA.id,
          tablePosIndex: 1,
        },
      }),
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'update',
        id: toUpdate.templateItems[0].id,
        updateDto: {
          displayName: 'B',
          menuItemId: itemB.id,
          tablePosIndex: 2,
        },
      }),
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'create',
        createDto: {
          displayName: 'B2',
          menuItemId: itemB.id,
          tablePosIndex: 3,
        },
      }),
    ];

    const dto = {
      templateName: 'UPDATE',
      isPie: true,
      templateItemDtos: itemDtos,
    } as UpdateTemplateDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(DUPLICATE);
    }
  });

  it('should fail update: duplicate TablePosIndex', async () => {
    const toUpdate = await templateService.findOneByName(template_a, [
      'templateItems',
    ]);
    if (!toUpdate) {
      throw new Error();
    }

    const itemA = await menuItemService.findOneByName(item_a);
    if (!itemA) {
      throw new Error();
    }
    const itemB = await menuItemService.findOneByName(item_b);
    if (!itemB) {
      throw new Error();
    }
    const itemC = await menuItemService.findOneByName(item_c);
    if (!itemC) {
      throw new Error();
    }

    const itemDtos = [
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'create',
        createDto: {
          displayName: 'A',
          menuItemId: itemA.id,
          tablePosIndex: 1,
        },
      }),
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'update',
        id: toUpdate.templateItems[0].id,
        updateDto: {
          displayName: 'B',
          menuItemId: itemB.id,
          tablePosIndex: 2,
        },
      }),
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'create',
        createDto: {
          displayName: 'B2',
          menuItemId: itemC.id,
          tablePosIndex: 2,
        },
      }),
    ];

    const dto = {
      templateName: 'UPDATE',
      isPie: true,
      templateItemDtos: itemDtos,
    } as UpdateTemplateDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(DUPLICATE);
    }
  });

  it('should fail update: Name exists', async () => {
    const toUpdate = await templateService.findOneByName(template_a, [
      'templateItems',
    ]);
    if (!toUpdate) {
      throw new Error();
    }

    const itemA = await menuItemService.findOneByName(item_a);
    if (!itemA) {
      throw new Error();
    }
    const itemB = await menuItemService.findOneByName(item_b);
    if (!itemB) {
      throw new Error();
    }

    const itemDtos = [
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'create',
        createDto: {
          displayName: 'A',
          menuItemId: itemA.id,
          tablePosIndex: 1,
        },
      }),
      plainToInstance(NestedTemplateMenuItemDto, {
        mode: 'update',
        id: toUpdate.templateItems[0].id,
        updateDto: {
          displayName: 'B',
          menuItemId: itemB.id,
          tablePosIndex: 2,
        },
      }),
    ];

    const dto = {
      templateName: template_b,
      isPie: true,
      templateItemDtos: itemDtos,
    } as UpdateTemplateDto;

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
