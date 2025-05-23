import { NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateMenuItemCategoryDto } from "../dto/menu-item-category/create-menu-item-category.dto";
import { UpdateMenuItemCategoryDto } from "../dto/menu-item-category/update-menu-item-category.dto";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemCategoryService } from "./menu-item-category.service";

describe('menu item category service', () => {
    let testingUtil: MenuItemTestingUtil;
    let categoryService: MenuItemCategoryService;
    let dbTestContext: DatabaseTestContext;

    let testId: number;
    let testIds: number[];

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemCategoryTestDatabase(dbTestContext);

        categoryService = module.get<MenuItemCategoryService>(MenuItemCategoryService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(categoryService).toBeDefined();
    });

    it('should create a category', async () => {
        const dto = {
            categoryName: "test category"
        } as CreateMenuItemCategoryDto;

        const result = await categoryService.create(dto);
        expect(result).not.toBeNull();
        expect(result?.categoryName).toEqual("test category");

        testId = result?.id as number;
    });

    it('should find a category by id', async () => {
        const result = await categoryService.findOne(testId);
        expect(result).not.toBeNull();
        expect(result?.categoryName).toEqual("test category");
    });

    it('should find a category by name', async () => {
        const result = await categoryService.findOneByName("test category");
        expect(result).not.toBeNull();
        expect(result?.id).toEqual(testId);
        expect(result?.categoryName).toEqual("test category");
    });

    it('should update a category name', async () => {
        const dto = {
            categoryName: "updated category name"
        } as UpdateMenuItemCategoryDto;

        const result = await categoryService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.categoryName).toEqual("updated category name");
    });

    it('should find all categories', async () => {
        const results = await categoryService.findAll();
        expect(results.items.length).toEqual(5);

        testIds = results.items.slice(0, 3).map(cat => cat.id);
    });

    it('should find categories by a list of ids', async () => {
        const results = await categoryService.findEntitiesById(testIds);
        expect(results.length).toEqual(3);
        for (const result of results) {
            expect(testIds.findIndex(id => id === result.id)).not.toEqual(-1)
        }
    });

    it('should remove a category', async () => {
        const removal = await categoryService.remove(testId);
        expect(removal).toBeTruthy();

        await expect(categoryService.findOne(testId)).rejects.toThrow(NotFoundException);
    });
})