import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateChildMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/create-child-menu-item-container-rule.dto";
import { UpdateChildMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/update-child-menu-item-container-rule.dto";
import { MenuItemContainerRuleService } from "../services/menu-item-container-rule.service";
import { MenuItemService } from "../services/menu-item.service";
import { item_a, item_b, item_c, item_f } from "../utils/constants";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemContainerRuleValidator } from "./menu-item-container-rule.validator";

describe('menu item container rule validator', () => {
    let testingUtil: MenuItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: MenuItemContainerRuleValidator;
    let ruleService: MenuItemContainerRuleService;
    let itemService: MenuItemService;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        validator = module.get<MenuItemContainerRuleValidator>(MenuItemContainerRuleValidator);
        ruleService = module.get<MenuItemContainerRuleService>(MenuItemContainerRuleService);
        itemService = module.get<MenuItemService>(MenuItemService);

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
        const item = await itemService.findOneByName(item_a, ['validSizes']);
        if(!item){ throw new Error(); }

        const dto = {
            mode: 'create',
            validMenuItemId: item.id,
            validSizeIds: [item.validSizes[0].id, item.validSizes[0].id],
        } as CreateChildMenuItemContainerRuleDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create: Empty size array', async () => {
        const item = await itemService.findOneByName(item_a, ['validSizes']);
        if(!item){ throw new Error(); }
 
        const dto = {
            mode: 'create',
            validMenuItemId: item.id,
            validSizeIds: [],
        } as CreateChildMenuItemContainerRuleDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual('validSizes is empty.');
    });

    it('should fail create: invalid sizes', async () => {
        const item = await itemService.findOneByName(item_a, ['validSizes']);
        if(!item){ throw new Error(); }

        const badItem = await itemService.findOneByName(item_b, ['validSizes']);
        if(!badItem){ throw new Error(); }

        const dto = {
            mode: 'create',
            validMenuItemId: item.id,
            validSizeIds: [badItem.validSizes[0].id, badItem.validSizes[1].id],
        } as CreateChildMenuItemContainerRuleDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`invalid size with id ${badItem.validSizes[0].id} assigned to validItem ${item.itemName} with id ${item.id}`);
    });

    it('should pass update', async () => {
        const rulesRequest = await ruleService.findAll();
        if(!rulesRequest){ throw new Error(); }

        const toUpdate = rulesRequest.items[0];

        const item = await itemService.findOneByName(item_a, ['validSizes']);
        if(!item){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            validMenuItemId: item.id,
            validSizeIds: item.validSizes.map(size => size.id),
        } as UpdateChildMenuItemContainerRuleDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update: empty size array', async () => {
        const rulesRequest = await ruleService.findAll();
        if(!rulesRequest){ throw new Error(); }

        const toUpdate = rulesRequest.items[0];

        const item = await itemService.findOneByName(item_a);
        if(!item){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            validMenuItemId: item.id,
            validSizeIds: [],
        } as UpdateChildMenuItemContainerRuleDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual('validSizes is empty.');
    });

    it('should fail update: invalid sizes', async () => {
        const rulesRequest = await ruleService.findAll();
        if(!rulesRequest){ throw new Error(); }

        const toUpdate = rulesRequest.items[0];

        const item = await itemService.findOneByName(item_a);
        if(!item){ throw new Error(); }

        const badItem = await itemService.findOneByName(item_f, ['validSizes']);
        if(!badItem){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            validMenuItemId: item.id,
            validSizeIds: badItem.validSizes.map(size => size.id),
        } as UpdateChildMenuItemContainerRuleDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`invalid size with id ${badItem.validSizes[0].id} assigned to validItem ${item.itemName} with id ${item.id}`);
    });

    it('should fail update: updating only sizes with invalid sizes', async () => {
        const rulesRequest = await ruleService.findAll({ relations: ['validItem']});
        if(!rulesRequest){ throw new Error(); }

        const toUpdate = rulesRequest.items[0];

        const badItem = await itemService.findOneByName(item_f, ['validSizes']);
        if(!badItem){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            validSizeIds: badItem.validSizes.map(size => size.id),
        } as UpdateChildMenuItemContainerRuleDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`invalid size with id ${badItem.validSizes[0].id} assigned to current item ${toUpdate.validItem.itemName} with id ${toUpdate.validItem.id}`);
    });

});