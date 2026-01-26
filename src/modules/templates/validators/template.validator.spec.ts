import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { expectValidationMessage } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { template_a } from '../utils/constants';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateValidator } from './template.validator';

describe('template validator', () => {
  let testingUtil: TemplateTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: TemplateValidator;
  let templateRepo: Repository<Template>;
  let menuItemRepo: Repository<MenuItem>;
  let templateMenuItemRepo: Repository<TemplateMenuItem>;

  beforeAll(async () => {
    const module: TestingModule = await getTemplateTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
    await testingUtil.initTemplateMenuItemTestDatabase(dbTestContext);

    validator = module.get<TemplateValidator>(TemplateValidator);

    templateRepo = module.get(getRepositoryToken(Template));
    menuItemRepo = module.get(getRepositoryToken(MenuItem));
    templateMenuItemRepo = module.get(
      getRepositoryToken(TemplateMenuItem),
    );
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  // Create Validation Tests
  it('successfully validate create: no validation errors', async () => {
    const menuItems = await menuItemRepo.find();
    if (menuItems.length < 2) {
      throw new Error('not enough menu items for test');
    }

    const dto: CreateTemplateDto = {
      name: 'New Template',
      templateMenuItems: [
        {
          createId: 'c1',
          displayName: 'Item 1',
          menuItemId: menuItems[0].id,
          tablePosIndex: 0,
        },
        {
          createId: 'c2',
          displayName: 'Item 2',
          menuItemId: menuItems[1].id,
          tablePosIndex: 1,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expect(errors).toBeNull();
  });

  it('fail validate create: name already exists', async () => {
    const dto: CreateTemplateDto = {
      name: template_a,
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'name' }],
      'Template with this name already exists.',
    );
  });

  it('fail validate create: duplicate menu items on template menu items', async () => {
    const menuItem = await menuItemRepo.findOne();
    if (!menuItem) {
      throw new Error('menu item not found');
    }

    const dto: CreateTemplateDto = {
      name: 'New Template',
      templateMenuItems: [
        {
          createId: 'c1',
          displayName: 'Item 1',
          menuItemId: menuItem.id,
          tablePosIndex: 0,
        },
        {
          createId: 'c2',
          displayName: 'Item 2',
          menuItemId: menuItem.id,
          tablePosIndex: 1,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'templateMenuItems' }],
      'duplicate menu item on template',
    );
  });

  it('fail validate create: duplicate table position on template items', async () => {
    const menuItems = await menuItemRepo.find();
    if (menuItems.length < 2) {
      throw new Error('not enough menu items for test');
    }

    const dto: CreateTemplateDto = {
      name: 'New Template',
      templateMenuItems: [
        {
          createId: 'c1',
          displayName: 'Item 1',
          menuItemId: menuItems[0].id,
          tablePosIndex: 0,
        },
        {
          createId: 'c2',
          displayName: 'Item 2',
          menuItemId: menuItems[1].id,
          tablePosIndex: 0,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'templateMenuItems' }],
      'duplicate table position on template',
    );
  });

  it('fail validate create: nested template menu items validator errors: positional index cannot be less than 0', async () => {
    const menuItem = await menuItemRepo.findOne();
    if (!menuItem) {
      throw new Error('menu item not found');
    }

    const dto: CreateTemplateDto = {
      name: 'New Template',
      templateMenuItems: [
        {
          createId: 'c1',
          displayName: 'Item 1',
          menuItemId: menuItem.id,
          tablePosIndex: -1,
        },
      ],
    };

    const errors = await validator.validateCreateNode(dto);
    expectValidationMessage(
      errors,
      [{ prop: 'templateMenuItems', id: 'c1' }, { prop: 'tablePosIndex' }],
      'positional index cannot be less than 0',
    );
  });

  // Update Validation Tests
  it('successfully validate update: no validation errors', async () => {
    const templateToUpdate = await templateRepo.findOne({
      where: { name: template_a },
      relations: ['templateMenuItems'],
    });
    if (!templateToUpdate) {
      throw new Error('template not found');
    }

    const menuItems = await menuItemRepo.find();
    if (menuItems.length < 2) {
      throw new Error('not enough menu items for test');
    }

    const dto: UpdateTemplateDto = {
      name: 'Updated Template',
      templateMenuItems: templateToUpdate.templateMenuItems &&
        templateToUpdate.templateMenuItems.length > 0
        ? [
            {
              id: templateToUpdate.templateMenuItems[0].id,
              tablePosIndex: 5,
            },
            {
              createId: 'c1',
              displayName: 'New Item',
              menuItemId: menuItems[0].id,
              tablePosIndex: 6,
            },
          ]
        : [
            {
              createId: 'c1',
              displayName: 'New Item',
              menuItemId: menuItems[0].id,
              tablePosIndex: 0,
            },
          ],
    };

    const errors = await validator.validateUpdateNode(
      dto,
      templateToUpdate.id,
    );
    expect(errors).toBeNull();
  });

  it('fail validate update: name already exists', async () => {
    const templates = await templateRepo.find();
    if (templates.length < 2) {
      throw new Error('Not enough templates for test');
    }

    const templateToUpdate = templates[0];
    const existingTemplate = templates[1];

    const dto: UpdateTemplateDto = {
      name: existingTemplate.name,
    };

    const errors = await validator.validateUpdateNode(
      dto,
      templateToUpdate.id,
    );
    expectValidationMessage(
      errors,
      [{ prop: 'name' }],
      'Template with this name already exists.',
    );
  });

  it('fail validate update: duplicate menu items on template menu items', async () => {
    const templateToUpdate = await templateRepo.findOne({
      where: { name: template_a },
    });
    if (!templateToUpdate) {
      throw new Error('template not found');
    }

    const menuItem = await menuItemRepo.findOne();
    if (!menuItem) {
      throw new Error('menu item not found');
    }

    const dto: UpdateTemplateDto = {
      templateMenuItems: [
        {
          createId: 'c1',
          displayName: 'Item 1',
          menuItemId: menuItem.id,
          tablePosIndex: 0,
        },
        {
          createId: 'c2',
          displayName: 'Item 2',
          menuItemId: menuItem.id,
          tablePosIndex: 1,
        },
      ],
    };

    const errors = await validator.validateUpdateNode(
      dto,
      templateToUpdate.id,
    );
    expectValidationMessage(
      errors,
      [{ prop: 'templateMenuItems' }],
      'duplicate menu item on template',
    );
  });

  it('fail validate update: duplicate table position on template items', async () => {
    const templateToUpdate = await templateRepo.findOne({
      where: { name: template_a },
    });
    if (!templateToUpdate) {
      throw new Error('template not found');
    }

    const menuItems = await menuItemRepo.find();
    if (menuItems.length < 2) {
      throw new Error('not enough menu items for test');
    }

    const dto: UpdateTemplateDto = {
      templateMenuItems: [
        {
          createId: 'c1',
          displayName: 'Item 1',
          menuItemId: menuItems[0].id,
          tablePosIndex: 0,
        },
        {
          createId: 'c2',
          displayName: 'Item 2',
          menuItemId: menuItems[1].id,
          tablePosIndex: 0,
        },
      ],
    };

    const errors = await validator.validateUpdateNode(
      dto,
      templateToUpdate.id,
    );
    expectValidationMessage(
      errors,
      [{ prop: 'templateMenuItems' }],
      'duplicate table position on template',
    );
  });

  it('fail validate update: nested template menu items validator errors: positional index cannot be less than 0', async () => {
    const templateToUpdate = await templateRepo.findOne({
      where: { name: template_a },
    });
    if (!templateToUpdate) {
      throw new Error('template not found');
    }

    const menuItem = await menuItemRepo.findOne();
    if (!menuItem) {
      throw new Error('menu item not found');
    }

    const dto: UpdateTemplateDto = {
      templateMenuItems: [
        {
          createId: 'c1',
          displayName: 'Item 1',
          menuItemId: menuItem.id,
          tablePosIndex: -1,
        },
      ],
    };

    const errors = await validator.validateUpdateNode(
      dto,
      templateToUpdate.id,
    );
    expectValidationMessage(
      errors,
      [{ prop: 'templateMenuItems', id: 'c1' }, { prop: 'tablePosIndex' }],
      'positional index cannot be less than 0',
    );
  });
});
