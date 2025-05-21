import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { type_a, type_b } from "../../labels/utils/constants";
import { CreateMenuItemCategoryDto } from "../dto/menu-item-category/create-menu-item-category.dto";
import { UpdateMenuItemCategoryDto } from "../dto/menu-item-category/update-menu-item-category.dto";
import { MenuItemCategoryService } from "../services/menu-item-category.service";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemCategoryValidator } from "./menu-item-category.validator";
import { MenuItemSizeValidator } from "./menu-item-size.validator";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { CreateMenuItemSizeDto } from "../dto/menu-item-size/create-menu-item-size.dto";
import { UpdateMenuItemSizeDto } from "../dto/menu-item-size/update-menu-item-size.dto";
import { SIZE_FOUR, SIZE_ONE, SIZE_TWO } from "../utils/constants";

describe('menu item size validator', () => {
    let testingUtil: MenuItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: MenuItemSizeValidator;
    let service: MenuItemSizeService;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        validator = module.get<MenuItemSizeValidator>(MenuItemSizeValidator);
        service = module.get<MenuItemSizeService>(MenuItemSizeService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemSizeTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });
    
    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
       const dto = {
            sizeName: "TEST CREATE",
        } as CreateMenuItemSizeDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create (name already exists)', async () => {
        const dto = {
            sizeName: SIZE_TWO,
        } as CreateMenuItemSizeDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`Menu item size with name ${SIZE_TWO} already exists`);
    });

    it('should pass update', async () => {
        const toUpdate = await service.findOneByName(SIZE_FOUR);
        if(!toUpdate){ throw new Error(); }

        const dto = {
            sizeName: "TEST UPDATE",
        } as UpdateMenuItemSizeDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update (name already exists)', async () => {
        const toUpdate = await service.findOneByName(SIZE_FOUR);
        if(!toUpdate){ throw new Error(); }

        const dto = {
            sizeName: SIZE_ONE,
        } as UpdateMenuItemSizeDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Menu item size with name ${SIZE_ONE} already exists`);
    });
});