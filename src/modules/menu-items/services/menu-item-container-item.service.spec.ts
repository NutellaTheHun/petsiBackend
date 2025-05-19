import { NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { plainToInstance } from "class-transformer";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { AppHttpException } from "../../../util/exceptions/AppHttpException";
import { CreateMenuItemContainerItemDto } from "../dto/menu-item-container-item/create-menu-item-container-item.dto";
import { UpdateMenuItemContainerItemDto } from "../dto/menu-item-container-item/update-menu-item-container-item.dto";
import { item_a, item_b, item_c, item_e, item_f, item_g } from "../utils/constants";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemContainerItemService } from "./menu-item-container-item.service";
import { MenuItemService } from "./menu-item.service";

describe('menu item container item service', () => {
    let testingUtil: MenuItemTestingUtil;
    let componentService: MenuItemContainerItemService;
    let dbTestContext: DatabaseTestContext;

    let testId: number;
    let testIds: number[];

    let testParentItemId: number;

    let menuItemService: MenuItemService;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);

        await testingUtil.initMenuItemComponentTestDatabase(dbTestContext);

        componentService = module.get<MenuItemContainerItemService>(MenuItemContainerItemService);
        menuItemService = module.get<MenuItemService>(MenuItemService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(menuItemService).toBeDefined();
    });

    it('should create a container item', async () => {

        const parent = await menuItemService.findOneByName(item_a, ['validSizes']);
        if(!parent){ throw new NotFoundException(); }
        if(!parent.validSizes){ throw new Error(); }

        const item = await menuItemService.findOneByName(item_e, ['validSizes']);
        if(!item){ throw new NotFoundException(); }
        if(!item.validSizes){ throw new Error(); }
        const dto = {
            mode: 'create',
            parentContainerId: parent.id,
            parentContainerSizeId: parent.validSizes[0].id,
            containedMenuItemId: item.id,
            containedMenuItemSizeId: item.validSizes[0].id,
            quantity: 1,
        } as CreateMenuItemContainerItemDto;

        const result = await componentService.create(dto);

        expect(result).not.toBeNull();

        testId = result?.id as number;
        testParentItemId = result?.parentContainer.id as number;
    });

    it('should query menu item with container item reference', async () => {
        const parentItem = await menuItemService.findOne(testParentItemId, ['container']);
        if(!parentItem){ throw new NotFoundException(); }
        if(!parentItem.definedContainerItems){ throw new Error(); }

        expect(parentItem.definedContainerItems.findIndex(comp => comp.id === testId)).not.toEqual(-1);
    });

    it('should find one container item by id', async () => {
        const result = await componentService.findOne(testId);

        expect(result).not.toBeNull();
    });

    it('should update containedItem', async () => {
        const newItem = await menuItemService.findOneByName(item_f, ['validSizes']);
        if(!newItem){ throw new NotFoundException(); }
        if(!newItem.validSizes){ throw new Error(); }

        const dto = {
            mode: 'update',
            containedMenuItemId: newItem.id,
            containedMenuItemSizeId: newItem.validSizes[0].id,
        } as UpdateMenuItemContainerItemDto;

        const result = await componentService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.containedItem){ throw new Error(); }
        if(!result.containedItemsize){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.containedItem.id).toEqual(newItem.id);
        expect(result?.containedItemsize.id).toEqual(newItem.validSizes[0].id);
    });

    it('should update contained item size', async () => {
        const item = await menuItemService.findOneByName(item_f, ['validSizes']);
        if(!item){ throw new NotFoundException(); }
        if(!item.validSizes){ throw new Error(); }

        const dto = {
            mode: 'update',
            containedMenuItemSizeId: item.validSizes[1].id,
        } as UpdateMenuItemContainerItemDto;

        const result = await componentService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.containedItemsize){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.containedItemsize.id).toEqual(item.validSizes[1].id);
    });

    it('should fail update container item (no size provided)', async () => {
        const newItem = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!newItem){ throw new NotFoundException(); }

        const dto = plainToInstance(UpdateMenuItemContainerItemDto, {
            mode: 'update',
            menuItemId: newItem.id,
        });

        await expect(componentService.update(testId, dto)).rejects.toThrow(AppHttpException);
    });

    it('should update quantity', async () => {
        const dto = {
            mode: 'update',
            quantity: 20,
        } as UpdateMenuItemContainerItemDto;

        const result = await componentService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.quantity).toEqual(20);
    });

    it('should find all container items', async () => {
        const results = await componentService.findAll();
        
        expect(results).not.toBeNull();

        testIds = results.items.slice(0,2).map(item => item.id);
    });

    it('should get container items by list of ids', async () => {
        const results = await componentService.findEntitiesById(testIds);

        expect(results).not.toBeNull();
        expect(results.length).toEqual(2);
    });

    it('should remove container item', async () => {
        const removal = await componentService.remove(testId);
        expect(removal).toBeTruthy();

        await expect(componentService.findOne(testId)).rejects.toThrow(NotFoundException);
    });

    it('should query menu item without container item reference', async () => {
        const parentItem = await menuItemService.findOne(testParentItemId, ['container']);
        if(!parentItem){ throw new NotFoundException(); }
        if(!parentItem.definedContainerItems){ throw new Error(); }

        const container = await componentService.findEntitiesById(parentItem.definedContainerItems.map(comp => comp.id), ['containedItem']);

        expect(container.findIndex(comp => comp.containedItem.id === testId)).toEqual(-1);
    });

    it('should delete menuItem and remove container item', async () => {
        const toDelete = await menuItemService.findOneByName(item_c);
        if(!toDelete){ throw new NotFoundException(); }

        const deleteId = toDelete.id;
        
        await menuItemService.remove(toDelete.id);

        const parentItem = await menuItemService.findOneByName(item_g, ['container']);
        if(!parentItem){ throw new NotFoundException(); }
        if(!parentItem.definedContainerItems){ throw new Error(); }

        const container = await componentService.findEntitiesById(parentItem.definedContainerItems.map(comp => comp.id), ['containedItem']);

        expect(container.findIndex(comp => comp.containedItem.id === deleteId)).toEqual(-1);
    });
});