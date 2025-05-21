import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { type_a, type_b } from "../../labels/utils/constants";
import { CreateChildMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/create-child-menu-item-container-rule.dto";
import { UpdateChildMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/update-child-menu-item-container-rule.dto";
import { MenuItemContainerRuleService } from "../services/menu-item-container-rule.service";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemContainerRuleValidator } from "./menu-item-container-rule.validator";

describe('menu item container rule validator', () => {
    let testingUtil: MenuItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: MenuItemContainerRuleValidator;
    let service: MenuItemContainerRuleService;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        validator = module.get<MenuItemContainerRuleValidator>(MenuItemContainerRuleValidator);
        service = module.get<MenuItemContainerRuleService>(MenuItemContainerRuleService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemContainerTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });
    
    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
       const dto = {

        } as CreateChildMenuItemContainerRuleDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create (name already exists)', async () => {
        const dto = {

        } as CreateChildMenuItemContainerRuleDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`Label type with name ${type_a} already exists`);
    });

    it('should pass update', async () => {
        const toUpdate = await service.findOneByName(type_b);
        if(!toUpdate){ throw new Error(); }

        const dto = {

        } as UpdateChildMenuItemContainerRuleDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update (name already exists)', async () => {
        const toUpdate = await service.findOneByName(type_b);
        if(!toUpdate){ throw new Error(); }

        const dto = {

        } as UpdateChildMenuItemContainerRuleDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Label type with name ${type_a} already exists`);
    });

});