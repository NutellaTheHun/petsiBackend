import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemCategoryService } from "./menu-item-category.service";

describe('menu item category service', () => {
    let testingUtil: MenuItemTestingUtil;
    let categoryService: MenuItemCategoryService;
    let dbTestContext: DatabaseTestContext;


    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);

        categoryService = module.get<MenuItemCategoryService>(MenuItemCategoryService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        //expect(service).toBeDefined();
    });
});