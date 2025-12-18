import { TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { item_a, item_b } from '../../menu-items/utils/constants';
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
      name: 'CREATE',
      isPie: true,
      templateMenuItems: itemDtos,
    } as CreateTemplateDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
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
      name: template_a,
      isPie: true,
      templateMenuItems: itemDtos,
    } as CreateTemplateDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('templateName');
  });

  /* No  templateMenuItem validator implementation
  it('should fail create: templateMenuItem validator: ....', async () => {
    throw new NotImplementedException();
  });*/

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
        id: toUpdate.templateMenuItems[0].id,
        updateDto: {
          displayName: 'B',
          menuItemId: itemB.id,
          tablePosIndex: 2,
        },
      }),
    ];

    const dto = {
      name: 'UPDATE',
      isPie: true,
      templateMenuItems: itemDtos,
    } as UpdateTemplateDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
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
        id: toUpdate.templateMenuItems[0].id,
        updateDto: {
          displayName: 'B',
          menuItemId: itemB.id,
          tablePosIndex: 2,
        },
      }),
    ];

    const dto = {
      name: template_b,
      isPie: true,
      templateMenuItems: itemDtos,
    } as UpdateTemplateDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('templateName');
  });

  /* No  templateMenuItem validator implementation
  it('should fail update: templateMenuItem validator: ....', async () => {
    throw new NotImplementedException();
  });*/
});
