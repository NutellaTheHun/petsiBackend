import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemComponentService } from "./menu-item-component.service";
import { MenuItemService } from "./menu-item.service";

describe('menu item component service', () => {
    let testingUtil: MenuItemTestingUtil;
    let componentService: MenuItemComponentService;
    let dbTestContext: DatabaseTestContext;

    let testId: number;
    let testIds: number[];

    let menuItemService: MenuItemService;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        //await testingUtil.initMenuItemCategoryTestDatabase(dbTestContext);

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

    });

    it('should query menu item with component reference', async () => {

    });

    it('should find one component by id', async () => {

    });

    it('should update component item', async () => {

    });

    it('should update component size', async () => {

    });

    it('should update component quantity', async () => {

    });

    it('should find all components', async () => {

    });

    it('should get components by list of ids', async () => {

    });

    it('should remove component', async () => {

    });

    it('should query menu item without component reference', async () => {

    });

    it('should delete menuItem and remove component', async () => {

    });
});