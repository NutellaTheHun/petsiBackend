import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemService } from "./menu-item.service";
import { CreateMenuItemDto } from "../dto/create-menu-item.dto";
import { UpdateMenuItemDto } from "../dto/update-menu-item.dto";
import exp from "constants";
import { MenuItemCategoryService } from "./menu-item-category.service";
import { CAT_BLUE, CAT_GREEN, CAT_RED, item_a, item_b, item_c } from "../utils/constants";
import { NotFoundException } from "@nestjs/common";
import { take } from "rxjs";
import { MenuItemSizeService } from "./menu-item-size.service";

describe('menu item service', () => {
    let testingUtil: MenuItemTestingUtil;
    let itemService: MenuItemService;
    let dbTestContext: DatabaseTestContext;

    let categoryService: MenuItemCategoryService;
    let sizeService: MenuItemSizeService;

    let testId: number;
    let testIds: number[];
    let validSizeAddIds: number[];
    let validSizeRemoveIds: number[];
    let deletedValidSizeId: number;
    let veganTakeNBakeId: number;
    let takeNBakeId: number;
    let veganId: number;

    const searchNames = ["name1", "name2", "name3"];
    const searchNamesMod = ["name1", "UpdateName2", "name3"];
    const searchNamesDel = ["name1", "UpdateName2"];
    

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemTestDatabase(dbTestContext);

        itemService = module.get<MenuItemService>(MenuItemService);
        categoryService = module.get<MenuItemCategoryService>(MenuItemCategoryService);
        sizeService = module.get<MenuItemSizeService>(MenuItemSizeService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(itemService).toBeDefined();
    });

    it('should create a menuItem', async () => {
        const dto = {
            name: "testItem",
        } as CreateMenuItemDto;

        const result = await itemService.create(dto);

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("testItem");

        testId = result?.id as number;
    });

    it('should find a menuItem by id', async () => {
        const result = await itemService.findOne(testId);

        expect(result).not.toBeNull();
        expect(result?.id).toEqual(testId);
        expect(result?.name).toEqual("testItem");
    });

    it('should find a menuItem by name', async () => {
        const result = await itemService.findOneByName("testItem");

        expect(result).not.toBeNull();
        expect(result?.id).toEqual(testId);
        expect(result?.name).toEqual("testItem");
    });

    it('should update squareCatalogId', async () => {
        const dto = {
            squareCatalogId: "123456"
        } as UpdateMenuItemDto;

        const result = await itemService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("testItem");
        expect(result?.squareCatalogId).toEqual("123456");
    });

    it('should update squareCategoryId', async () => {
        const dto = {
            squareCategoryId: "abcdef"
        } as UpdateMenuItemDto;

        const result = await itemService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("testItem");
        expect(result?.squareCatalogId).toEqual("123456");
        expect(result?.squareCategoryId).toEqual("abcdef");
    });

    it('should update name', async () => {
        const dto = {
            name: "updateTestName"
        } as UpdateMenuItemDto;

        const result = await itemService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("updateTestName");
        expect(result?.squareCatalogId).toEqual("123456");
        expect(result?.squareCategoryId).toEqual("abcdef");
    });

    it('should update searchNames (add)', async () => {
        const dto = {
            searchNames: searchNames
        } as UpdateMenuItemDto;

        const result = await itemService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.searchNames){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("updateTestName");
        expect(result?.squareCatalogId).toEqual("123456");
        expect(result?.squareCategoryId).toEqual("abcdef");
        for(const name of result?.searchNames){
            expect(searchNames.findIndex(sName => sName === name)).not.toEqual(-1);
        }
    });

    it('should update searchNames (modify)', async () => {
        const dto = {
            searchNames: searchNamesMod
        } as UpdateMenuItemDto;

        const result = await itemService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.searchNames){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("updateTestName");
        expect(result?.squareCatalogId).toEqual("123456");
        expect(result?.squareCategoryId).toEqual("abcdef");
        for(const name of result?.searchNames){
            expect(searchNamesMod.findIndex(sName => sName === name)).not.toEqual(-1);
        }
        expect(searchNames.findIndex(sName => sName === "name2")).toEqual(-1);
    });

    it('should update searchNames (remove)', async () => {
        const dto = {
            searchNames: searchNamesDel
        } as UpdateMenuItemDto;

        const result = await itemService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.searchNames){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("updateTestName");
        expect(result?.squareCatalogId).toEqual("123456");
        expect(result?.squareCategoryId).toEqual("abcdef");
        for(const name of result?.searchNames){
            expect(searchNamesMod.findIndex(sName => sName === name)).not.toEqual(-1);
        }
        expect(searchNames.findIndex(sName => sName === "name2")).toEqual(-1);
        expect(searchNames.findIndex(sName => sName === "name3")).toEqual(-1);
    });

    it('should update isPOTM', async () => {
        const dto = {
            isPOTM: true
        } as UpdateMenuItemDto;

        const result = await itemService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.searchNames){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("updateTestName");
        expect(result?.squareCatalogId).toEqual("123456");
        expect(result?.squareCategoryId).toEqual("abcdef");
        expect(result.searchNames.length).toEqual(2);
        expect(searchNames.findIndex(sName => sName === "name2")).toEqual(-1);
        expect(searchNames.findIndex(sName => sName === "name3")).toEqual(-1);
        expect(result.isPOTM).toBeTruthy();
    });

    it('should update isParBake', async () => {
        const dto = {
            isParbake: true
        } as UpdateMenuItemDto;

        const result = await itemService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.searchNames){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("updateTestName");
        expect(result?.squareCatalogId).toEqual("123456");
        expect(result?.squareCategoryId).toEqual("abcdef");
        expect(result.searchNames.length).toEqual(2);
        expect(searchNames.findIndex(sName => sName === "name2")).toEqual(-1);
        expect(searchNames.findIndex(sName => sName === "name3")).toEqual(-1);
        expect(result.isPOTM).toBeTruthy();
        expect(result.isParbake).toBeTruthy();
    });

    it('should update category', async () => {
        const category = await categoryService.findOneByName(CAT_RED);
        if(!category){ throw new NotFoundException(); }

        const dto = {
            categoryId: category.id
        } as UpdateMenuItemDto;

        const result = await itemService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.searchNames){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("updateTestName");
        expect(result?.squareCatalogId).toEqual("123456");
        expect(result?.squareCategoryId).toEqual("abcdef");
        expect(result.searchNames.length).toEqual(2);
        expect(searchNames.findIndex(sName => sName === "name2")).toEqual(-1);
        expect(searchNames.findIndex(sName => sName === "name3")).toEqual(-1);
        expect(result.isPOTM).toBeTruthy();
        expect(result.isParbake).toBeTruthy();
        expect(result.category?.id).toEqual(category.id);
        expect(result.category?.name).toEqual(CAT_RED);
    });

    it('should add reference to category', async () => {
        const category = await categoryService.findOneByName(CAT_RED, ['items']);
        if(!category){ throw new NotFoundException(); }

        expect(category.items?.findIndex(item => item.id === testId)).not.toEqual(-1);
    });

    it('should change category', async () => {
        const category = await categoryService.findOneByName(CAT_BLUE);
        if(!category){ throw new NotFoundException(); }

        const dto = {
            categoryId: category.id
        } as UpdateMenuItemDto;

        const result = await itemService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.searchNames){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("updateTestName");
        expect(result?.squareCatalogId).toEqual("123456");
        expect(result?.squareCategoryId).toEqual("abcdef");
        expect(result.searchNames.length).toEqual(2);
        expect(searchNames.findIndex(sName => sName === "name2")).toEqual(-1);
        expect(searchNames.findIndex(sName => sName === "name3")).toEqual(-1);
        expect(result.isPOTM).toBeTruthy();
        expect(result.isParbake).toBeTruthy();
        expect(result.category?.id).toEqual(category.id);
        expect(result.category?.name).toEqual(CAT_BLUE);
    });

    it('should lose reference to old category', async () => {
        const category = await categoryService.findOneByName(CAT_RED, ['items']);
        if(!category){ throw new NotFoundException(); }

        expect(category.items?.findIndex(item => item.id === testId)).toEqual(-1);
    });

    it('should gain reference to new category', async () => {
        const category = await categoryService.findOneByName(CAT_BLUE, ['items']);
        if(!category){ throw new NotFoundException(); }

        expect(category.items?.findIndex(item => item.id === testId)).not.toEqual(-1);
    });

    it('should set to no category', async () => {
        const dto = {
            categoryId: 0
        } as UpdateMenuItemDto;

        const result = await itemService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.searchNames){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("updateTestName");
        expect(result?.squareCatalogId).toEqual("123456");
        expect(result?.squareCategoryId).toEqual("abcdef");
        expect(result.searchNames.length).toEqual(2);
        expect(searchNames.findIndex(sName => sName === "name2")).toEqual(-1);
        expect(searchNames.findIndex(sName => sName === "name3")).toEqual(-1);
        expect(result.isPOTM).toBeTruthy();
        expect(result.isParbake).toBeTruthy();
        expect(result.category).toBeNull();
    });

    it('should lose reference to previous category', async () => {
        const category = await categoryService.findOneByName(CAT_BLUE, ['items']);
        if(!category){ throw new NotFoundException(); }

        expect(category.items?.findIndex(item => item.id === testId)).toEqual(-1);
    });

    it('should update veganOption', async () => {
        const veganItem = await itemService.findOneByName(item_a);
        if(!veganItem){ throw new NotFoundException(); }

        const dto = {
            veganOptionMenuId: veganItem?.id
        } as UpdateMenuItemDto;

        const result = await itemService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.searchNames){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("updateTestName");
        expect(result?.squareCatalogId).toEqual("123456");
        expect(result?.squareCategoryId).toEqual("abcdef");
        expect(result.searchNames.length).toEqual(2);
        expect(searchNames.findIndex(sName => sName === "name2")).toEqual(-1);
        expect(searchNames.findIndex(sName => sName === "name3")).toEqual(-1);
        expect(result.isPOTM).toBeTruthy();
        expect(result.isParbake).toBeTruthy();
        expect(result.category).toBeNull();
        expect(result.veganOption?.id).toEqual(veganItem.id);
        expect(result.veganOption?.name).toEqual(veganItem.name);

        veganId = result.veganOption?.id as number;
    });

    it('should update takeNBakeOption', async () => {
        const takeNBakeItem = await itemService.findOneByName(item_b);
        if(!takeNBakeItem){ throw new NotFoundException(); }

        const dto = {
            takeNBakeOptionMenuId: takeNBakeItem.id
        } as UpdateMenuItemDto;

        const result = await itemService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.searchNames){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("updateTestName");
        expect(result?.squareCatalogId).toEqual("123456");
        expect(result?.squareCategoryId).toEqual("abcdef");
        expect(result.searchNames.length).toEqual(2);
        expect(searchNames.findIndex(sName => sName === "name2")).toEqual(-1);
        expect(searchNames.findIndex(sName => sName === "name3")).toEqual(-1);
        expect(result.isPOTM).toBeTruthy();
        expect(result.isParbake).toBeTruthy();
        expect(result.category).toBeNull();
        expect(result.takeNBakeOption?.id).toEqual(takeNBakeItem.id);
        expect(result.takeNBakeOption?.name).toEqual(takeNBakeItem.name);

        takeNBakeId = result.takeNBakeOption?.id as number;
    });

    it('should update veganTakeNBakeOption', async () => {
        const veganTakeNBakeItem = await itemService.findOneByName(item_c);
        if(!veganTakeNBakeItem){ throw new NotFoundException(); }
        
        const dto = {
            veganTakeNBakeOptionMenuId: veganTakeNBakeItem.id
        } as UpdateMenuItemDto;

        const result = await itemService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.searchNames){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("updateTestName");
        expect(result?.squareCatalogId).toEqual("123456");
        expect(result?.squareCategoryId).toEqual("abcdef");
        expect(result.searchNames.length).toEqual(2);
        expect(searchNames.findIndex(sName => sName === "name2")).toEqual(-1);
        expect(searchNames.findIndex(sName => sName === "name3")).toEqual(-1);
        expect(result.isPOTM).toBeTruthy();
        expect(result.isParbake).toBeTruthy();
        expect(result.category).toBeNull();
        expect(result.veganTakeNBakeOption?.id).toEqual(veganTakeNBakeItem.id);
        expect(result.veganTakeNBakeOption?.name).toEqual(veganTakeNBakeItem.name);

        veganTakeNBakeId = result.veganTakeNBakeOption?.id as number;
    });

    it('should update validSizes (add)', async () => {
        const sizes = await sizeService.findAll();
        if(!sizes){ throw new Error(); }

        const dto = {
            validSizeIds: sizes.map(size => size.id),
        } as UpdateMenuItemDto;

        const result = await itemService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.searchNames){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("updateTestName");
        expect(result?.squareCatalogId).toEqual("123456");
        expect(result?.squareCategoryId).toEqual("abcdef");
        expect(result.searchNames.length).toEqual(2);
        expect(searchNames.findIndex(sName => sName === "name2")).toEqual(-1);
        expect(searchNames.findIndex(sName => sName === "name3")).toEqual(-1);
        expect(result.isPOTM).toBeTruthy();
        expect(result.isParbake).toBeTruthy();
        expect(result.category).toBeNull();
        expect(result.validSizes?.length).toEqual(4);
    });

    it('should update validSizes (remove)', async () => {
        const sizes = await sizeService.findAll();
        if(!sizes){ throw new Error(); }

        const reducedSizes = sizes.slice(0,3).map(size => size.id);
        deletedValidSizeId = sizes[3].id;

        const dto = {
            validSizeIds: reducedSizes,
        } as UpdateMenuItemDto;

        const result = await itemService.update(testId, dto);
        if(!result){ throw new Error(); }
        if(!result.searchNames){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result?.name).toEqual("updateTestName");
        expect(result?.squareCatalogId).toEqual("123456");
        expect(result?.squareCategoryId).toEqual("abcdef");
        expect(result.searchNames.length).toEqual(2);
        expect(searchNames.findIndex(sName => sName === "name2")).toEqual(-1);
        expect(searchNames.findIndex(sName => sName === "name3")).toEqual(-1);
        expect(result.isPOTM).toBeTruthy();
        expect(result.isParbake).toBeTruthy();
        expect(result.category).toBeNull();
        expect(result.validSizes?.length).toEqual(3);
        expect(result.validSizes?.findIndex(size => size.id === deletedValidSizeId)).toEqual(-1);
    });

    it('should retain all updated properties', async () => {
        const item = await itemService.findOne(testId, ['category', 'takeNBakeOption', 'validSizes', 'veganOption', 'veganTakeNBakeOption']);
        if(!item){ throw new NotFoundException(); }
        if(!item.searchNames){ throw new Error(); }

        expect(item).not.toBeNull();
        expect(item?.name).toEqual("updateTestName");
        expect(item?.squareCatalogId).toEqual("123456");
        expect(item?.squareCategoryId).toEqual("abcdef");
        expect(item.searchNames.length).toEqual(2);
        expect(searchNames.findIndex(sName => sName === "name2")).toEqual(-1);
        expect(searchNames.findIndex(sName => sName === "name3")).toEqual(-1);
        expect(item.isPOTM).toBeTruthy();
        expect(item.isParbake).toBeTruthy();
        expect(item.category).toBeNull();
        expect(item.validSizes?.length).toEqual(3);
        expect(item.validSizes?.findIndex(size => size.id === deletedValidSizeId)).toEqual(-1);
        expect(item.veganTakeNBakeOption?.id).toEqual(veganTakeNBakeId);
        expect(item.takeNBakeOption?.id).toEqual(takeNBakeId);
        expect(item.veganOption?.id).toEqual(veganId);
    })

    it('should find all menuItems', async () => {
        const results = await itemService.findAll();
        if(!results){ throw new Error(); }

        expect(results.length).toEqual(8);

        testIds = results.slice(0,3).map(item => item.id);
    });

    it('should find menuItems by list of ids', async () => {
        const results = await itemService.findEntitiesById(testIds);
        if(!results){ throw new Error(); }

        expect(results.length).toEqual(4);
    });

    it('should remove menu item', async () => {
        const category = await categoryService.findOneByName(CAT_GREEN);
        if(!category){ throw new NotFoundException(); }

        const dto = {
            categoryId: category.id,
        } as UpdateMenuItemDto;

        await itemService.update(testId, dto);

        const removal = await itemService.remove(testId);
        expect(removal).toBeTruthy();

        const verify = await itemService.findOne(testId);
        expect(verify).toBeNull();
    });

    it('should remove refence from category', async () => {
        const category = await categoryService.findOneByName(CAT_GREEN, ['items']);
        if(!category){ throw new NotFoundException(); }

        expect(category.items?.findIndex(item => item.id === testId)).toEqual(-1);
    });
});