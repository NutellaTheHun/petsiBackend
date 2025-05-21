import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { type_a, type_b } from "../../labels/utils/constants";
import { CreateMenuItemCategoryDto } from "../dto/menu-item-category/create-menu-item-category.dto";
import { UpdateMenuItemCategoryDto } from "../dto/menu-item-category/update-menu-item-category.dto";
import { MenuItemCategoryService } from "../services/menu-item-category.service";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemCategoryValidator } from "./menu-item-category.validator";
import { CAT_BLUE, CAT_GREEN, CAT_RED } from "../utils/constants";

describe('menu item category validator', () => {
    let testingUtil: MenuItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: MenuItemCategoryValidator;
    let service: MenuItemCategoryService;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        validator = module.get<MenuItemCategoryValidator>(MenuItemCategoryValidator);
        service = module.get<MenuItemCategoryService>(MenuItemCategoryService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemCategoryTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });
    
    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
       const dto = {
            categoryName: "TEST NAME"
        } as CreateMenuItemCategoryDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create (name already exists)', async () => {
        const dto = {
            categoryName: CAT_RED
        } as CreateMenuItemCategoryDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`Menu item category with name ${CAT_RED} already exists`);
    });

    it('should pass update', async () => {
        const toUpdate = await service.findOneByName(CAT_GREEN);
        if(!toUpdate){ throw new Error(); }

        const dto = {
            categoryName: "UPDATE TEST"
        } as UpdateMenuItemCategoryDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update (name already exists)', async () => {
        const toUpdate = await service.findOneByName(CAT_BLUE);
        if(!toUpdate){ throw new Error(); }

        const dto = {
            categoryName: CAT_RED
        } as UpdateMenuItemCategoryDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Menu item category with name ${CAT_RED} already exists`);
    });
});