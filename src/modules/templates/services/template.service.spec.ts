import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DatabaseTestContext } from '../../../util/DatabaseTestContext';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { item_a, item_b, item_c } from '../../menu-items/utils/constants';
import { MenuItemTestingUtil } from '../../menu-items/utils/menu-item-testing.util';
import { CreateChildTemplateMenuItemDto } from '../dto/create-child-template-menu-item.dto';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateMenuItemDto } from '../dto/update-template-menu-item.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import { getTemplateTestingModule } from '../utils/template-testing.module';
import { TemplateTestingUtil } from '../utils/template-testing.util';
import { TemplateMenuItemService } from './template-menu-item.service';
import { TemplateService } from './template.service';

describe('Template Service', () => {
  let templateService: TemplateService;
  let testingUtil: TemplateTestingUtil;
  let dbTestContext: DatabaseTestContext;

  let templateItemService: TemplateMenuItemService;

  let menuItemService: MenuItemService;
  let menuItemTestUtil: MenuItemTestingUtil;

  let testId: number;
  let testIds: number[];

  let addedItemIds: number[];
  let modifiedItemId: number;
  let modifiedMenuItemId: number;
  let deletedItemId: number;

  let removedItemIds: number[];

  beforeAll(async () => {
    const module: TestingModule = await getTemplateTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
    await testingUtil.initTemplateTestDatabase(dbTestContext);

    templateService = module.get<TemplateService>(TemplateService);
    templateItemService = module.get<TemplateMenuItemService>(TemplateMenuItemService);

    menuItemService = module.get<MenuItemService>(MenuItemService);
    menuItemTestUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await menuItemTestUtil.initMenuItemTestDatabase(dbTestContext);
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(templateService).toBeDefined();
  });

  it('should create a template', async() => {
    const dto = {
      name: "testTemplate"
    } as CreateTemplateDto;

    const result = await templateService.create(dto);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual("testTemplate");
    testId = result?.id as number;
  });

  it('should find a template by id', async() => {
    const result = await templateService.findOne(testId);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual("testTemplate");
  });

  it('should find a template by name', async() => {
    const result = await templateService.findOneByName("testTemplate");

    expect(result).not.toBeNull();
    expect(result?.name).toEqual("testTemplate");
    expect(result?.id).toEqual(testId);
  });

  it('should update a template name', async() => {
    const dto = {
      name: "update testTemplate"
    } as UpdateTemplateDto;

    const result = await templateService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual("update testTemplate");
  });

  it('should update a template isPie', async() => {
    const dto = {
      isPie: true,
    } as UpdateTemplateDto;

    const result = await templateService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.isPie).toEqual(true);
  });

  it('should add template items', async() => {
    const itemA = await menuItemService.findOneByName(item_a);
    if(!itemA){ throw new NotFoundException(); }
    const itemB = await menuItemService.findOneByName(item_b);
    if(!itemB){ throw new NotFoundException(); }

    const itemDtos = [
      {
        mode: 'create',
        displayName: "itemA",
        menuItemId: itemA.id,
        tablePosIndex: 0,
      },
      {
        mode: 'create',
        displayName: "itemB",
        menuItemId: itemB.id,
        tablePosIndex: 1,
      }
    ] as CreateChildTemplateMenuItemDto[];

    const dto = {
      itemDtos: itemDtos,
    } as UpdateTemplateDto;

    const result = await templateService.update(testId, dto);
    if(!result){ throw new Error(); }
    if(!result.templateItems){ throw new Error(); }
    expect(result).not.toBeNull();
    expect(result?.templateItems?.length).toEqual(2);

    addedItemIds = result?.templateItems?.map(i => i.id);
  });

  it('should query added template items', async() => {
    const results = await templateItemService.findEntitiesById(addedItemIds, ['template']);
    if(!results){ throw new Error(); }

    expect(results).not.toBeNull();
    expect(results.length).toEqual(2);
    for(const item of results){
      expect(item.template.id).toEqual(testId);
    }
  });

  it('should modify a template item', async() => {
    const template = await templateService.findOne(testId, ['templateItems']);
    if(!template){throw new NotFoundException(); }
    if(!template.templateItems){ throw new Error(); }

    modifiedItemId = template.templateItems[0].id;

    const newItem = await menuItemService.findOneByName(item_c);
    if(!newItem){ throw new NotFoundException(); }
    modifiedMenuItemId = newItem.id;

    const uItemDto = {
      mode: 'update',
      id: modifiedItemId,
      displayName: "update display name",
      tablePosIndex: 10,
      menuItemId: modifiedMenuItemId,
    } as UpdateTemplateMenuItemDto;

    const theRest = template.templateItems.slice(1).map(item => ({
      mode: 'update',
      id: item.id,
    }) as UpdateTemplateMenuItemDto);

    const dto = {
      itemDtos: [ uItemDto, ...theRest]
    } as UpdateTemplateDto;

    const result = await templateService.update(testId, dto);
    if(!result){ throw new Error(); }
    if(!result.templateItems){ throw new Error(); }

    expect(result).not.toBeNull();
    for(const item of result.templateItems){
      if(item.id === modifiedItemId){
        expect(item.displayName).toEqual("update display name");
        expect(item.tablePosIndex).toEqual(10);
        expect(item.menuItem.id).toEqual(modifiedMenuItemId);
      }
    }
  });

  it('should query modified template item', async() => {
    const modifiedItem = await templateItemService.findOne(modifiedItemId, ['template', 'menuItem']);
    if(!modifiedItem){ throw new Error(); }

    expect(modifiedItem.displayName).toEqual("update display name");
    expect(modifiedItem.tablePosIndex).toEqual(10);
    expect(modifiedItem.menuItem.id).toEqual(modifiedMenuItemId);
  });

  it('should remove a template item', async() => {
    const template = await templateService.findOne(testId, ['templateItems']);
    if(!template){throw new NotFoundException(); }
    if(!template.templateItems){ throw new Error(); }

    deletedItemId = template.templateItems[0].id;

    const uItemDtos = template.templateItems.slice(1).map(item => ({
      mode: 'update',
      id: item.id
    }) as UpdateTemplateMenuItemDto);

    const dto = {
      itemDtos: uItemDtos
    } as UpdateTemplateDto;

    const result = await templateService.update(testId, dto);

    expect(result).not.toBeNull();
    expect(result?.templateItems?.length).toEqual(1)
  });

  it('should not query removed template item', async() => {
    const removed = await templateItemService.findOne(deletedItemId);
    expect(removed).toBeNull();
  });

  it('should find all templates', async() => {
    const results = await templateService.findAll();

    expect(results).not.toBeNull();
    expect(results.items.length).toEqual(5);

    testIds = results.items.slice(0,3).map(temp => temp.id);
  });

  it('should find templates by list of ids', async() => {
    const results = await templateService.findEntitiesById(testIds);

    expect(results).not.toBeNull();
    expect(results.length).toEqual(3);
  });

  it('should remove a template', async() => {
    const template = await templateService.findOne(testId, ['templateItems']);
    if(!template){ throw new NotFoundException();}
    if(!template.templateItems){ throw new Error();}

    removedItemIds = template.templateItems.map(item => item.id);

    const removal = await templateService.remove(testId);
    expect(removal).toBeTruthy();

    const verify = await templateService.findOne(testId);
    expect(verify).toBeNull();
  });

  it('should remove template menuItems', async() => {
    const removed = await templateItemService.findEntitiesById(removedItemIds);

    expect(removed).not.toBeNull();
    expect(removed.length).toEqual(0);
  });
});
