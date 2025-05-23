import { NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateMenuItemSizeDto } from "../dto/menu-item-size/create-menu-item-size.dto";
import { UpdateMenuItemSizeDto } from "../dto/menu-item-size/update-menu-item-size.dto";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemSizeService } from "./menu-item-size.service";

describe('menu item size service', () => {
    let testingUtil: MenuItemTestingUtil;
    let sizeService: MenuItemSizeService;
    let dbTestContext: DatabaseTestContext;

    let testId: number;
    let testIds: number[];

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemSizeTestDatabase(dbTestContext);

        sizeService = module.get<MenuItemSizeService>(MenuItemSizeService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(sizeService).toBeDefined();
    });

    it('should create a size', async () => {
        const dto = {
            sizeName: "test Size",
        } as CreateMenuItemSizeDto;

        const result = await sizeService.create(dto);
        expect(result).not.toBeNull();
        expect(result?.name).toEqual("test Size")

        testId = result?.id as number;
    });

    it('should find a size by id', async () => {
        const result = await sizeService.findOne(testId);
        expect(result).not.toBeNull();
        expect(result?.id).toEqual(testId);
        expect(result?.name).toEqual("test Size");
    });

    it('should find a size by name', async () => {
        const result = await sizeService.findOneByName("test Size");
        expect(result).not.toBeNull();
        expect(result?.id).toEqual(testId);
        expect(result?.name).toEqual("test Size");
    });

    it('should update a size', async () => {
        const dto = {
            sizeName: "updated test size",
        } as UpdateMenuItemSizeDto;

        const result = await sizeService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.id).toEqual(testId);
        expect(result?.name).toEqual("updated test size");
    });

    it('should find all sizes', async () => {
        const results = await sizeService.findAll();
        expect(results.items.length).toEqual(5);
        testIds = results.items.slice(0, 3).map(size => size.id);
    });

    it('should find sizes by a list of ids', async () => {
        const results = await sizeService.findEntitiesById(testIds);
        expect(results.length).toEqual(3);
        for (const result of results) {
            expect(testIds.findIndex(id => id === result.id)).not.toEqual(-1);
        }
    });

    it('should remove a size', async () => {
        const removal = await sizeService.remove(testId);
        expect(removal).toBeTruthy();

        await expect(sizeService.findOne(testId)).rejects.toThrow(NotFoundException);
    });
});