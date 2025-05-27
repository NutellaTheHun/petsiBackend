import { NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/create-menu-item-container-rule.dto";
import { UpdateMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/update-menu-item-container-rule.dto";
import { item_a, item_b } from "../utils/constants";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemContainerRuleService } from "./menu-item-container-rule.service";
import { MenuItemService } from "./menu-item.service";

describe('menu item container rule service', () => {
    let testingUtil: MenuItemTestingUtil;
    let compOptionService: MenuItemContainerRuleService;
    let dbTestContext: DatabaseTestContext;

    let itemService: MenuItemService;

    let testId: number;
    let testIds: number[];

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemContainerTestDatabase(dbTestContext);

        compOptionService = module.get<MenuItemContainerRuleService>(MenuItemContainerRuleService);
        itemService = module.get<MenuItemService>(MenuItemService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(compOptionService).toBeDefined();
    });

    it('should fail to create a container rule', async () => {
        const dto = {
        } as CreateMenuItemContainerRuleDto;

        await expect(compOptionService.create(dto)).rejects.toThrow();
    });

    it('should find all container rules', async () => {
        const results = await compOptionService.findAll();
        expect(results.items.length).toEqual(4);

        testIds = results.items.slice(0, 3).map(cat => cat.id);
        testId = results.items[0].id;
    });

    it('should find all container rules', async () => {
        const results = await compOptionService.findAll({ sortBy: 'validItem' });
        expect(results.items.length).toEqual(4);
    });

    it('should find a container rule by id', async () => {
        const result = await compOptionService.findOne(testId);
        expect(result).not.toBeNull();
    });

    it('should update validItem and size', async () => {
        const toUpdate = await compOptionService.findOne(testId, ['validItem']);
        if (!toUpdate) { throw new Error("comp option is null"); }
        if (!toUpdate.validItem) { throw new Error("comp option valid item is null"); }

        let newItem;
        if (toUpdate.validItem.itemName === item_a) {
            const itemB = await itemService.findOneByName(item_b, ['validSizes']);
            if (!itemB) { throw new Error("item b is null"); }
            if (!itemB.validSizes) { throw new Error("item b valid sizes is null"); }
            newItem = itemB;
        } else {
            const itemA = await itemService.findOneByName(item_a, ['validSizes']);
            if (!itemA) { throw new Error("item b is null"); }
            if (!itemA.validSizes) { throw new Error("item b valid sizes is null"); }
            newItem = itemA;
        }

        const dto = {
            validMenuItemId: newItem.id,
            validSizeIds: [newItem.validSizes[0].id],
        } as UpdateMenuItemContainerRuleDto;

        const result = await compOptionService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.validItem.id).toEqual(newItem.id);
        expect(result?.validSizes[0].id).toEqual(newItem.validSizes[0].id);
    });

    it('should update validSizes (add)', async () => {
        const toUpdate = await compOptionService.findOne(testId, ['validItem']);
        if (!toUpdate) { throw new Error("comp option is null"); }
        if (!toUpdate.validItem) { throw new Error("comp option valid item is null"); }

        const newItem = await itemService.findOne(toUpdate.validItem.id, ['validSizes']);
        if (!newItem) { throw new Error("item b is null"); }
        if (!newItem.validSizes) { throw new Error("item b valid sizes is null"); }

        const dto = {
            validSizeIds: newItem.validSizes.map(size => size.id),
        } as UpdateMenuItemContainerRuleDto;

        const result = await compOptionService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.validSizes.length).toEqual(newItem.validSizes?.length);
    });

    it('should update validSizes (remove)', async () => {
        const toUpdate = await compOptionService.findOne(testId, ['validItem']);
        if (!toUpdate) { throw new Error("comp option is null"); }
        if (!toUpdate.validItem) { throw new Error("comp option valid item is null"); }

        const newItem = await itemService.findOne(toUpdate.validItem.id, ['validSizes']);
        if (!newItem) { throw new Error("item b is null"); }
        if (!newItem.validSizes) { throw new Error("item b valid sizes is null"); }

        const dto = {
            validSizeIds: [newItem.validSizes[0].id],
        } as UpdateMenuItemContainerRuleDto;

        const result = await compOptionService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.validSizes.length).toEqual(1);
    });

    it('should find container rules by a list of ids', async () => {
        const results = await compOptionService.findEntitiesById(testIds);
        expect(results.length).toEqual(testIds.length);
        for (const result of results) {
            expect(testIds.findIndex(id => id === result.id)).not.toEqual(-1)
        }
    });

    it('should remove a container rule', async () => {
        const removal = await compOptionService.remove(testId);
        expect(removal).toBeTruthy();

        await expect(compOptionService.findOne(testId)).rejects.toThrow(NotFoundException);
    });
})