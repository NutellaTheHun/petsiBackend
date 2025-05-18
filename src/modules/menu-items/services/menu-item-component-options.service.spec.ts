import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateChildComponentOptionDto } from "../dto/child-component-option/create-child-component-option.dto";
import { UpdateChildComponentOptionDto } from "../dto/child-component-option/update-child-component-option.dto";
import { CreateMenuItemComponentOptionsDto } from "../dto/menu-item-component-options/create-menu-item-component-options.dto";
import { UpdateMenuItemComponentOptionsDto } from "../dto/menu-item-component-options/update-menu-item-component-options.dto";
import { item_a } from "../utils/constants";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemComponentOptionsService } from "./menu-item-component-options.service";
import { MenuItemService } from "./menu-item.service";

describe('menu item component options service', () => {
    let testingUtil: MenuItemTestingUtil;
    let itemComponentOptionsService: MenuItemComponentOptionsService;
    let dbTestContext: DatabaseTestContext;

    let itemService: MenuItemService;

    let testId: number;
    let testIds: number[];

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemTestDatabase(dbTestContext);

        itemComponentOptionsService = module.get<MenuItemComponentOptionsService>(MenuItemComponentOptionsService);
        itemService = module.get<MenuItemService>(MenuItemService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(itemComponentOptionsService).toBeDefined();
    });

    it('should fail to create menuItemComponentOptions', async () => {
        const dto = {
        } as CreateMenuItemComponentOptionsDto;

        await expect(itemComponentOptionsService.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should find all menuItemComponentOptions', async () => {
        const results = await itemComponentOptionsService.findAll();
        expect(results.items.length).toEqual(5);

        testId = results.items[0].id;
        testIds = results.items.slice(0,2).map(cat => cat.id);
    });

    it('should find menuItemComponentOptions by id', async () => {
        const result = await itemComponentOptionsService.findOne(testId);
        expect(result).not.toBeNull();
    });

    it('should update isDynamic', async () => {
        const toUpdate = await itemComponentOptionsService.findOne(testId);
        const val = toUpdate.isDynamic === true ? false : true;

        const dto = {
            isDynamic: val,
        } as UpdateMenuItemComponentOptionsDto;

        const result = await itemComponentOptionsService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.isDynamic).toEqual(val);
    });

    it('should update validComponents (add)', async () => {
        const toUpdate = await itemComponentOptionsService.findOne(testId); 
        if(!toUpdate){ throw new Error("menu item components to update is null"); }
        if(!toUpdate.validComponents){ throw new Error("valid components  is null"); }
        const originalCompSize = toUpdate.validComponents.length;

        const itemA = await itemService.findOneByName(item_a);
        if(!itemA){ throw new Error("item a is null"); }
        if(!itemA.validSizes){ throw new Error("valid sizes is null"); }

        const createCompOptionDto = {
            mode: 'create',
            validMenuItemId: itemA.id,
            validSizeIds: itemA.validSizes.map(size => size.id),
            quantity: 2,
       } as CreateChildComponentOptionDto;

       const theRest = toUpdate.validComponents.map(comp => ({
            mode: 'update',
            id: comp.id,
       }) as UpdateChildComponentOptionDto)
 
        const dto = {
            componentOptionDtos: [ createCompOptionDto, ...theRest],
        } as UpdateMenuItemComponentOptionsDto;

        const result = await itemComponentOptionsService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.validComponents.length).toEqual(originalCompSize+1);
    });

    it('should update validComponents (remove)', async () => {
        const toUpdate = await itemComponentOptionsService.findOne(testId); 
        if(!toUpdate){ throw new Error("menu item components to update is null"); }
        if(!toUpdate.validComponents){ throw new Error("valid components  is null"); }
        const originalCompSize = toUpdate.validComponents.length;

        const theRest = toUpdate.validComponents.slice(originalCompSize-1).map(comp => ({
            mode: 'update',
            id: comp.id,
       }) as UpdateChildComponentOptionDto)

        const dto = {
            componentOptionDtos: theRest,
        } as UpdateMenuItemComponentOptionsDto;

        const result = await itemComponentOptionsService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.validComponents.length).toEqual(originalCompSize-1);
    });

    it('should update validComponents (modify)', async () => {
        const toUpdate = await itemComponentOptionsService.findOne(testId); 
        if(!toUpdate){ throw new Error("menu item components to update is null"); }
        if(!toUpdate.validComponents){ throw new Error("valid components  is null"); }

        const compToModId = toUpdate.validComponents[0].id;
        /*const modDto = {
            mode: 'update',
            id: compToModId,
            quantity: 100,
        } as UpdateChildComponentOptionDto;

        const theRest = toUpdate.validComponents.slice(1, toUpdate.validComponents.length).map(comp => ({
            mode: 'update',
            id: comp.id,
       }) as UpdateChildComponentOptionDto)*/

        const updateDtos = toUpdate.validComponents.map(comp => ({
            mode: 'update',
            id: comp.id,
       }) as UpdateChildComponentOptionDto)

       updateDtos[0].quantity = 100;

        const dto = {
            //componentOptionDtos: [ modDto, ...theRest],
            componentOptionDtos: updateDtos,
        } as UpdateMenuItemComponentOptionsDto;

        const result = await itemComponentOptionsService.update(testId, dto);
        expect(result).not.toBeNull();
        for(const compOption of result.validComponents){
            if(compOption.id === compToModId){
                expect(compOption.validQuantity).toEqual(100);
            }
        }
    });

    it('should update validQuantity', async () => {
        const toUpdate = await itemComponentOptionsService.findOne(testId); 
        if(!toUpdate){ throw new Error("menu item components to update is null"); }

        const dto = {
            validQuantity: 500,
        } as UpdateMenuItemComponentOptionsDto;

        const result = await itemComponentOptionsService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.validQuantity).toEqual(500);
    });

    it('should find menuItemComponentOptions by a list of ids', async () => {
        const results = await itemComponentOptionsService.findEntitiesById(testIds);
        expect(results.length).toEqual(testIds.length);
        for(const result of results){
            expect(testIds.findIndex(id => id === result.id)).not.toEqual(-1)
        }
    });

    it('should remove a menuItemComponentOptions', async () => {
        const removal = await itemComponentOptionsService.remove(testId);
        expect(removal).toBeTruthy();

        await expect(itemComponentOptionsService.findOne(testId)).rejects.toThrow(NotFoundException);
    });
})