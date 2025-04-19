import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemSizeService } from "./menu-item-size.service";

describe('menu item size service', () => {
    let testingUtil: MenuItemTestingUtil;
    let sizeService: MenuItemSizeService;
    let dbTestContext: DatabaseTestContext;

    beforeAll(async () => {
         const module: TestingModule = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);

        sizeService = module.get<MenuItemSizeService>(MenuItemSizeService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        //expect(service).toBeDefined();
    });
});