import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { item_a, item_b } from '../../menu-items/utils/constants';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { Template } from '../entities/template.entity';
import { template_a, template_b } from '../utils/constants';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateValidator } from './template.validator';

describe('template validator', () => {
  let testingUtil: TemplateTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: TemplateValidator;
  let templateRepo: Repository<Template>;
  let menuItemRepo: Repository<MenuItem>;

  beforeAll(async () => {
    const module: TestingModule = await getTemplateTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
    await testingUtil.initTemplateMenuItemTestDatabase(dbTestContext);

    validator = module.get<TemplateValidator>(TemplateValidator);

    templateRepo = module.get(getRepositoryToken(Template));
    menuItemRepo = module.get(getRepositoryToken(MenuItem));
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
