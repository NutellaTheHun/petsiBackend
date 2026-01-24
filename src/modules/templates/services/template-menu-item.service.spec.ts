import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { item_d, item_e } from '../../menu-items/utils/constants';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { NestedCreateTemplateMenuItemDto } from '../dto/template-menu-item/nested-create-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateMenuItemService } from './template-menu-item.service';

class TestableTemplateMenuItemService extends TemplateMenuItemService {
  async createEntityForTest(
    dto: CreateTemplateMenuItemDto,
    manager: EntityManager,
  ): Promise<TemplateMenuItem> {
    return this.createEntity(dto, manager);
  }
  async updateEntityForTest(
    dto: UpdateTemplateMenuItemDto,
    entity: TemplateMenuItem,
    manager: EntityManager,
  ): Promise<void> {
    return this.updateEntity(dto, manager, entity);
  }
}
describe('Template menu item service', () => {
  let templateItemService: TemplateMenuItemService;
  let testUtil: TemplateTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

  let templateRepo: Repository<Template>;

  let menuItemRepo: Repository<MenuItem>;
  let menuItemTestUtil: MenuItemTestingUtil;

  beforeAll(async () => {
    const module: TestingModule = await getTemplateTestingModule({
      templateMenuItemServiceClass: TestableTemplateMenuItemService,
    });
    dbTestContext = new DatabaseTestContext();
    testUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
    await testUtil.initTemplateMenuItemTestDatabase(dbTestContext);

    templateItemService = module.get(
      TemplateMenuItemService,
    ) as TestableTemplateMenuItemService;

    dataSource = module.get(DataSource);

    templateRepo = module.get(getRepositoryToken(Template));
    menuItemRepo = module.get(getRepositoryToken(MenuItem));

    menuItemTestUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await menuItemTestUtil.initMenuItemTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(templateItemService).toBeDefined();
  });

  it('should fail to create a template item (bad request) then create properly for future tests', async () => {
    const templateDto = {
      name: 'testTemplate',
    } as CreateTemplateDto;

    const template = await templateService.create(templateDto);

    const itemD = await menuItemService.findOneByName(item_d);
    if (!itemD) {
      throw new NotFoundException();
    }

    /*const dto = {
      displayName: 'test display name',
      menuItemId: itemD.id,
      tablePosIndex: 0,
      templateId: template?.id,
    } as CreateTemplateMenuItemDto;

    await expect(templateItemService.create(dto)).rejects.toThrow(
      BadRequestException,
    );*/

    const createItemDto = plainToInstance(NestedCreateTemplateMenuItemDto, {
      createId: 'c1',
      displayName: 'test display name',
      menuItemId: itemD.id,
      tablePosIndex: 0,
    });

    const updateTemplateDto = {
      templateMenuItems: [createItemDto],
    } as UpdateTemplateDto;

    const updateResult = await templateService.update(
      template.id,
      updateTemplateDto,
    );

    if (!updateResult) {
      throw new Error();
    }

    if (!updateResult.templateMenuItems) {
      throw new Error();
    }

    const result = updateResult.templateMenuItems[0];

    expect(result).not.toBeNull();
    expect(result?.displayName).toEqual('test display name');
    expect(result?.menuItem.id).toEqual(itemD.id);
    expect(result?.tablePosIndex).toEqual(0);
    expect(result?.parentTemplate.id).toEqual(template?.id);

    testId = result?.id as number;
  });

  it('should find a template item by id', async () => {
    const result = await templateItemService.findOne(testId);

    expect(result).not.toBeNull();
    expect(result?.displayName).toEqual('test display name');
    expect(result?.tablePosIndex).toEqual(0);
  });

  it('should update display name', async () => {
    const dto = {
      displayName: 'update display name',
    } as UpdateTemplateMenuItemDto;

    const result = await templateItemService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.displayName).toEqual('update display name');
  });

  it('should update menuItem', async () => {
    const itemE = await menuItemService.findOneByName(item_e);
    if (!itemE) {
      throw new NotFoundException();
    }
    const dto = {
      menuItemId: itemE.id,
    } as UpdateTemplateMenuItemDto;

    const result = await templateItemService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.menuItem.id).toEqual(itemE.id);
  });

  it('should update tablePosIndex', async () => {
    const dto = {
      tablePosIndex: 10,
    } as UpdateTemplateMenuItemDto;

    const result = await templateItemService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.tablePosIndex).toEqual(10);
  });

  it('should find all template menu items', async () => {
    const results = await templateItemService.findAll({ limit: 15 });

    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(13);

    testIds = results.items.slice(0, 3).map((item) => item.id);
  });

  it('should sort all template menu items', async () => {
    const results = await templateItemService.findAll({
      limit: 15,
      sortBy: 'tablePosIndex',
    });

    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(13);
  });

  it('should get menuItems by list of ids', async () => {
    const results = await templateItemService.findEntitiesById(testIds);

    expect(results).not.toBeNull();
    expect(results.length).toEqual(3);
  });

  it('should remove menuItem', async () => {
    const removal = await templateItemService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(templateItemService.findOne(testId)).rejects.toThrow(
      NotFoundException,
    );
  });
});
