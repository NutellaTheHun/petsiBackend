import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemComponentService } from "./menu-item-component.service";
import { MenuItemService } from "./menu-item.service";
import { CreateMenuItemComponentDto } from "../dto/create-menu-item-component.dto";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { UpdateMenuItemComponentDto } from "../dto/update-menu-item-component.dto";
import { item_a, item_b, item_c, item_e, item_f, item_g } from "../utils/constants";
import { plainToInstance } from "class-transformer";
import { validateOrReject, ValidationError } from "class-validator";

describe('menu item component service', () => {
    let testingUtil: MenuItemTestingUtil;
    let componentService: MenuItemComponentService;
    let dbTestContext: DatabaseTestContext;

    let testId: number;
    let testIds: number[];

    let testParentItemId: number;

    let menuItemService: MenuItemService;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);

        // ItemF: {itemA, itemB}, ItemG: {ItemC, ItemD}s
        await testingUtil.initMenuItemComponentTestDatabase(dbTestContext);

        componentService = module.get<MenuItemComponentService>(MenuItemComponentService);
        menuItemService = module.get<MenuItemService>(MenuItemService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(menuItemService).toBeDefined();
    });

    it('should create a component', async () => {

        const parent = await menuItemService.findOneByName(item_a, ['validSizes']);
        if(!parent){ throw new NotFoundException(); }
        if(!parent.validSizes){ throw new Error(); }

        const item = await menuItemService.findOneByName(item_e, ['validSizes']);
        if(!item){ throw new NotFoundException(); }
        if(!item.validSizes){ throw new Error(); }
        const dto = {
            mode: 'create',
            containerId: parent.id,
            containerSizeId: parent.validSizes[0].id,
            menuItemId: item.id,
            menuItemSizeId: item.validSizes[0].id,
            quantity: 1,
        } as CreateMenuItemComponentDto;

        const result = await componentService.create(dto);

        expect(result).not.toBeNull();

        testId = result?.id as number;
        testParentItemId = result?.container.id as number;
    });

    it('should query menu item with component reference', async () => {
        const parentItem = await menuItemService.findOne(testParentItemId, ['container']);
        if(!parentItem){ throw new NotFoundException(); }
        if(!parentItem.container){ throw new Error(); }

        expect(parentItem.container.findIndex(comp => comp.id === testId)).not.toEqual(-1);
    });

    it('should find one component by id', async () => {
        const result = await componentService.findOne(testId);

        expect(result).not.toBeNull();
    });

    it('should update component item', async () => {
        const newItem = await menuItemService.findOneByName(item_f, ['validSizes']);
        if(!newItem){ throw new NotFoundException(); }
        if(!newItem.validSizes){ throw new Error(); }

        const dto = {
            mode: 'update',
            menuItemId: newItem.id,
            menuItemSizeId: newItem.validSizes[0].id,
        } as UpdateMenuItemComponentDto;

        const result = await componentService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.item){ throw new Error(); }
        if(!result.size){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.item.id).toEqual(newItem.id);
        expect(result?.size.id).toEqual(newItem.validSizes[0].id);
    });

    it('should update component size', async () => {
        const item = await menuItemService.findOneByName(item_f, ['validSizes']);
        if(!item){ throw new NotFoundException(); }
        if(!item.validSizes){ throw new Error(); }

        const dto = {
            mode: 'update',
            menuItemSizeId: item.validSizes[1].id,
        } as UpdateMenuItemComponentDto;

        const result = await componentService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.size){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.size.id).toEqual(item.validSizes[1].id);
    });

    it('should fail update component item (no size provided)', async () => {
        const newItem = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!newItem){ throw new NotFoundException(); }

        const dto = plainToInstance(UpdateMenuItemComponentDto, {
            mode: 'update',
            menuItemId: newItem.id,
        });

        await expect(componentService.update(testId, dto)).rejects.toThrow(BadRequestException);

        /*try{
            await validateOrReject(dto);
            const result = await componentService.update(testId, dto);
            expect(result).toBeNull();
        } catch(errors){
            if (Array.isArray(errors) && errors.every(e => e instanceof ValidationError)) {
            expect(errors).not.toBeNull();
            } else {
            throw errors
            }
        }*/
    });

    it('should update component quantity', async () => {
        const dto = {
            mode: 'update',
            quantity: 20,
        } as UpdateMenuItemComponentDto;

        const result = await componentService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.quantity).toEqual(20);
    });

    it('should find all components', async () => {
        const results = await componentService.findAll();
        
        expect(results).not.toBeNull();

        testIds = results.items.slice(0,2).map(item => item.id);
    });

    it('should get components by list of ids', async () => {
        const results = await componentService.findEntitiesById(testIds);

        expect(results).not.toBeNull();
        expect(results.length).toEqual(2);
    });

    it('should remove component', async () => {
        const removal = await componentService.remove(testId);
        expect(removal).toBeTruthy();

        const verify = await componentService.findOne(testId);
        expect(verify).toBeNull();
    });

    it('should query menu item without component reference', async () => {
        const parentItem = await menuItemService.findOne(testParentItemId, ['container']);
        if(!parentItem){ throw new NotFoundException(); }
        if(!parentItem.container){ throw new Error(); }

        const container = await componentService.findEntitiesById(parentItem.container.map(comp => comp.id), ['item']);

        expect(container.findIndex(comp => comp.item.id === testId)).toEqual(-1);
    });

    it('should delete menuItem and remove component', async () => {
        const toDelete = await menuItemService.findOneByName(item_c);
        if(!toDelete){ throw new NotFoundException(); }

        const deleteId = toDelete.id;
        
        await menuItemService.remove(toDelete.id);

        const parentItem = await menuItemService.findOneByName(item_g, ['container']);
        if(!parentItem){ throw new NotFoundException(); }
        if(!parentItem.container){ throw new Error(); }

        const container = await componentService.findEntitiesById(parentItem.container.map(comp => comp.id), ['item']);

        expect(container.findIndex(comp => comp.item.id === deleteId)).toEqual(-1);
    });
});