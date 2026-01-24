import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { item_a, item_b, item_c } from '../../menu-items/utils/constants';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { NestedCreateTemplateMenuItemDto } from '../dto/template-menu-item/nested-create-template-menu-item.dto';
import { NestedUpdateTemplateMenuItemDto } from '../dto/template-menu-item/nested-update-template-menu-item.dto';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { template_a } from '../utils/constants';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateService } from './template.service';

class TestableTemplateService extends TemplateService {
  async createEntityForTest(
    dto: CreateTemplateDto,
    manager: EntityManager,
  ): Promise<Template> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateTemplateDto,
    entity: Template,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}

describe('Template Service', () => {
  let templateService: TemplateService;
  let testingUtil: TemplateTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let templateItemRepo: Repository<TemplateMenuItem>;

  let menuItemRepo: Repository<MenuItem>;
  let menuItemTestUtil: MenuItemTestingUtil;

  beforeAll(async () => {
    const module: TestingModule = await getTemplateTestingModule({
      templateServiceClass: TestableTemplateService,
    });
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
    await testingUtil.initTemplateTestDatabase(dbTestContext);

    templateService = module.get(TemplateService) as TestableTemplateService;
    dataSource = module.get(DataSource);

    templateItemRepo = module.get(getRepositoryToken(TemplateMenuItem));
    menuItemRepo = module.get(getRepositoryToken(MenuItem));
    menuItemTestUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await menuItemTestUtil.initMenuItemTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(templateService).toBeDefined();
  });

  it('should create a template', async () => {
    const dto = {
      name: 'testTemplate',
    } as CreateTemplateDto;

    const result = await templateService.create(dto);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('testTemplate');
    testId = result?.id as number;
  });

  it('should find a template by id', async () => {
    const result = await templateService.findOne(testId);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('testTemplate');
  });

  it('should find a template by name', async () => {
    const result = await templateService.findOneByName('testTemplate');

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('testTemplate');
    expect(result?.id).toEqual(testId);
  });

  it('should update a template name', async () => {
    const dto = {
      name: 'update testTemplate',
    } as UpdateTemplateDto;

    const result = await templateService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('update testTemplate');
  });

  it('should update a template isPie', async () => {
    const dto = {
      isPie: true,
    } as UpdateTemplateDto;

    const result = await templateService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.isPie).toEqual(true);
  });

  it('should add template items', async () => {
    const itemA = await menuItemService.findOneByName(item_a);
    if (!itemA) {
      throw new NotFoundException();
    }
    const itemB = await menuItemService.findOneByName(item_b);
    if (!itemB) {
      throw new NotFoundException();
    }

    const itemDtos = [
      plainToInstance(NestedCreateTemplateMenuItemDto, {
        createId: 'c1',
        displayName: 'itemA',
        menuItemId: itemA.id,
        tablePosIndex: 0,
      }),
      plainToInstance(NestedCreateTemplateMenuItemDto, {
        createId: 'c2',
        displayName: 'itemB',
        menuItemId: itemB.id,
        tablePosIndex: 1,
      }),
    ];

    const dto = {
      templateMenuItems: itemDtos,
    } as UpdateTemplateDto;

    const result = await templateService.update(testId, dto);
    if (!result) {
      throw new Error();
    }
    if (!result.templateMenuItems) {
      throw new Error();
    }
    expect(result).not.toBeNull();
    expect(result?.templateMenuItems?.length).toEqual(2);

    addedItemIds = result?.templateMenuItems?.map((i) => i.id);
  });

  it('should query added template items', async () => {
    const results = await templateItemService.findEntitiesById(addedItemIds, [
      'parentTemplate',
    ]);
    if (!results) {
      throw new Error();
    }

    expect(results).not.toBeNull();
    expect(results.length).toEqual(2);
    for (const item of results) {
      expect(item.parentTemplate.id).toEqual(testId);
    }
  });

  it('should modify a template item', async () => {
    const template = await templateService.findOne(testId, [
      'templateMenuItems',
    ]);
    if (!template) {
      throw new NotFoundException();
    }
    if (!template.templateMenuItems) {
      throw new Error();
    }

    modifiedItemId = template.templateMenuItems[0].id;

    const newItem = await menuItemService.findOneByName(item_c);
    if (!newItem) {
      throw new NotFoundException();
    }
    modifiedMenuItemId = newItem.id;

    const uItemDto = plainToInstance(NestedUpdateTemplateMenuItemDto, {
      id: modifiedItemId,
      displayName: 'update display name',
      tablePosIndex: 10,
      menuItemId: modifiedMenuItemId,
    });

    const theRest = template.templateMenuItems.slice(1).map((item) =>
      plainToInstance(NestedUpdateTemplateMenuItemDto, {
        id: item.id,
      }),
    );

    const dto = {
      templateMenuItems: [uItemDto, ...theRest],
    } as UpdateTemplateDto;

    const result = await templateService.update(testId, dto);
    if (!result) {
      throw new Error();
    }
    if (!result.templateMenuItems) {
      throw new Error();
    }

    expect(result).not.toBeNull();
    for (const item of result.templateMenuItems) {
      if (item.id === modifiedItemId) {
        expect(item.displayName).toEqual('update display name');
        expect(item.tablePosIndex).toEqual(10);
        expect(item.menuItem.id).toEqual(modifiedMenuItemId);
      }
    }
  });

  it('should query modified template item', async () => {
    const modifiedItem = await templateItemService.findOne(modifiedItemId, [
      'parentTemplate',
      'menuItem',
    ]);
    if (!modifiedItem) {
      throw new Error();
    }

    expect(modifiedItem.displayName).toEqual('update display name');
    expect(modifiedItem.tablePosIndex).toEqual(10);
    expect(modifiedItem.menuItem.id).toEqual(modifiedMenuItemId);
  });

  it('should remove a template item', async () => {
    const template = await templateService.findOne(testId, [
      'templateMenuItems',
    ]);
    if (!template) {
      throw new NotFoundException();
    }
    if (!template.templateMenuItems) {
      throw new Error();
    }

    deletedItemId = template.templateMenuItems[0].id;

    const uItemDtos = template.templateMenuItems.slice(1).map((item) =>
      plainToInstance(NestedUpdateTemplateMenuItemDto, {
        id: item.id,
      }),
    );

    const dto = {
      templateMenuItems: uItemDtos,
    } as UpdateTemplateDto;

    const result = await templateService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.templateMenuItems?.length).toEqual(1);
  });

  it('should not query removed template item', async () => {
    await expect(templateItemService.findOne(deletedItemId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should find all templates', async () => {
    const results = await templateService.findAll();

    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(5);

    testIds = results.items.slice(0, 3).map((temp) => temp.id);
  });

  it('should sort all templates', async () => {
    const results = await templateService.findAll({ sortBy: 'templateName' });

    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(5);
  });

  it('should search for templates', async () => {
    const results = await templateService.findAll({ search: template_a });

    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(1);
  });

  it('should find templates by list of ids', async () => {
    const results = await templateService.findEntitiesById(testIds);

    expect(results).not.toBeNull();
    expect(results.length).toEqual(3);
  });

  it('should remove a template', async () => {
    const template = await templateService.findOne(testId, [
      'templateMenuItems',
    ]);
    if (!template) {
      throw new NotFoundException();
    }
    if (!template.templateMenuItems) {
      throw new Error();
    }

    removedItemIds = template.templateMenuItems.map((item) => item.id);

    const removal = await templateService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(templateService.findOne(testId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should remove template menuItems', async () => {
    const removed = await templateItemService.findEntitiesById(removedItemIds);

    expect(removed).not.toBeNull();
    expect(removed.length).toEqual(0);
  });
});
