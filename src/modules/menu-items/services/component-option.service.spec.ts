import { NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateComponentOptionDto } from "../dto/child-component-option/create-component-option.dto";
import { UpdateComponentOptionDto } from "../dto/child-component-option/update-component-option.dto";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { ComponentOptionService } from "./component-option.service";
import { MenuItemService } from "./menu-item.service";
import { item_a, item_b } from "../utils/constants";
import { MenuItem } from "../entities/menu-item.entity";

describe('component option service', () => {
    let testingUtil: MenuItemTestingUtil;
    let compOptionService: ComponentOptionService;
    let dbTestContext: DatabaseTestContext;

    let itemService: MenuItemService;

    let testId: number;
    let testIds: number[];

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemTestDatabase(dbTestContext);

        compOptionService = module.get<ComponentOptionService>(ComponentOptionService);
        itemService = module.get<MenuItemService>(MenuItemService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(compOptionService).toBeDefined();
    });

    it('should fail to create a component option', async () => {
        const dto = {
        } as CreateComponentOptionDto;

        await expect(compOptionService.create(dto)).rejects.toThrow();
    });

    it('should find all component options', async () => {
        const results = await compOptionService.findAll();
        expect(results.items.length).toEqual(5);

        testIds = results.items.slice(0,3).map(cat => cat.id);
        testId = results.items[0].id;
    });

    it('should find a component option by id', async () => {
        const result = await compOptionService.findOne(testId);
        expect(result).not.toBeNull();
    });

    it('should update component option validItem and size', async () => {
        const toUpdate = await compOptionService.findOne(testId);
        if(!toUpdate){ throw new Error("comp option is null"); }
        if(!toUpdate.validItem){ throw new Error("comp option valid item is null"); }

        let newItem;
        if(toUpdate.validItem.name === item_a){
            const itemB = await itemService.findOneByName(item_b);
            if(!itemB){ throw new Error("item b is null"); }
            if(!itemB.validSizes){ throw new Error("item b valid sizes is null"); }
            newItem = itemB;
        } else {
            const itemA = await itemService.findOneByName(item_a);
            if(!itemA){ throw new Error("item b is null"); }
            if(!itemA.validSizes){ throw new Error("item b valid sizes is null"); }
            newItem = itemA;
        }
        
        const dto = {
            validMenuItemId: newItem.id,
            validSizeIds: [ newItem.validSizes[0].id ],
        } as UpdateComponentOptionDto;

        const result = await compOptionService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.validItem.id).toEqual(newItem.id);
        expect(result?.validSizes[0].id).toEqual(newItem.validSizes[0].id);
    });

    it('should update component option validSizes (add)', async () => {
        const toUpdate = await compOptionService.findOne(testId);
        if(!toUpdate){ throw new Error("comp option is null"); }
        if(!toUpdate.validItem){ throw new Error("comp option valid item is null"); }

        let newItem: MenuItem;
        if(toUpdate.validItem.name === item_a){
            const itemB = await itemService.findOneByName(item_b);
            if(!itemB){ throw new Error("item b is null"); }
            if(!itemB.validSizes){ throw new Error("item b valid sizes is null"); }
            newItem = itemB;
        } else {
            const itemA = await itemService.findOneByName(item_a);
            if(!itemA){ throw new Error("item b is null"); }
            if(!itemA.validSizes){ throw new Error("item b valid sizes is null"); }
            newItem = itemA;
        }
        
        const dto = {
            validSizeIds: newItem.validSizes?.map(size => size.id),
        } as UpdateComponentOptionDto;

        const result = await compOptionService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.validSizes.length).toEqual(newItem.validSizes?.length);
    });

    it('should update component option validSizes (remove)', async () => {
        const toUpdate = await compOptionService.findOne(testId);
        if(!toUpdate){ throw new Error("comp option is null"); }
        if(!toUpdate.validItem){ throw new Error("comp option valid item is null"); }

        let newItem: MenuItem;
        if(toUpdate.validItem.name === item_a){
            const itemB = await itemService.findOneByName(item_b);
            if(!itemB){ throw new Error("item b is null"); }
            if(!itemB.validSizes){ throw new Error("item b valid sizes is null"); }
            newItem = itemB;
        } else {
            const itemA = await itemService.findOneByName(item_a);
            if(!itemA){ throw new Error("item b is null"); }
            if(!itemA.validSizes){ throw new Error("item b valid sizes is null"); }
            newItem = itemA;
        }
        if(!newItem.validSizes){ throw new Error(); }

        const dto = {
            validSizeIds: [ newItem.validSizes[0].id ],
        } as UpdateComponentOptionDto;

        const result = await compOptionService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.validSizes.length).toEqual(1);
    });


    it('should update component option validQuantity', async () => {
        const dto = {
            quantity: 200
        } as UpdateComponentOptionDto;

        const result = await compOptionService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.validQuantity).toEqual(200);
    });

    it('should find component options by a list of ids', async () => {
        const results = await compOptionService.findEntitiesById(testIds);
        expect(results.length).toEqual(testIds.length);
        for(const result of results){
            expect(testIds.findIndex(id => id === result.id)).not.toEqual(-1)
        }
    });

    it('should remove a component option', async () => {
        const removal = await compOptionService.remove(testId);
        expect(removal).toBeTruthy();

        await expect(compOptionService.findOne(testId)).rejects.toThrow(NotFoundException);
    });
})