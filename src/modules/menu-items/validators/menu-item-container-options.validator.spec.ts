import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateChildMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/create-child-menu-item-container-options.dto";
import { UpdateChildMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/update-child-menu-item-container-options.dto";
import { CreateChildMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/create-child-menu-item-container-rule.dto";
import { UpdateChildMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/update-child-menu-item-container-rule.dto";
import { MenuItemContainerOptionsService } from "../services/menu-item-container-options.service";
import { MenuItemService } from "../services/menu-item.service";
import { item_a, item_b } from "../utils/constants";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemContainerOptionsValidator } from "./menu-item-container-options.validator";

describe('menu item container options validator', () => {
    let testingUtil: MenuItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: MenuItemContainerOptionsValidator;
    let containerService: MenuItemContainerOptionsService;
    let itemService: MenuItemService;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        validator = module.get<MenuItemContainerOptionsValidator>(MenuItemContainerOptionsValidator);
        containerService = module.get<MenuItemContainerOptionsService>(MenuItemContainerOptionsService);
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
        const itemA = await itemService.findOneByName(item_a, ['validSizes']);
        if (!itemA) { throw new Error(); }

        const itemB = await itemService.findOneByName(item_b, ['validSizes']);
        if (!itemB) { throw new Error(); }

        const ruleDtos = [
            {
                mode: 'create',
                validMenuItemId: itemA.id,
                validSizeIds: [itemA.validSizes[0].id],
            } as CreateChildMenuItemContainerRuleDto,
            {
                mode: 'create',
                validMenuItemId: itemB.id,
                validSizeIds: [itemB.validSizes[0].id],
            } as CreateChildMenuItemContainerRuleDto,
        ] as CreateChildMenuItemContainerRuleDto[];
        const dto = {
            mode: 'create',
            containerRuleDtos: ruleDtos,
            validQuantity: 3,
        } as CreateChildMenuItemContainerOptionsDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create: duplicate item rules', async () => {
        const itemA = await itemService.findOneByName(item_a, ['validSizes']);
        if (!itemA) { throw new Error(); }

        const itemB = await itemService.findOneByName(item_a, ['validSizes']);
        if (!itemB) { throw new Error(); }

        const ruleDtos = [
            {
                mode: 'create',
                validMenuItemId: itemA.id,
                validSizeIds: [itemA.validSizes[0].id],
            } as CreateChildMenuItemContainerRuleDto,
            {
                mode: 'create',
                validMenuItemId: itemB.id,
                validSizeIds: [itemB.validSizes[0].id],
            } as CreateChildMenuItemContainerRuleDto,
            {
                mode: 'create',
                validMenuItemId: itemA.id,
                validSizeIds: [itemA.validSizes[1].id],
            } as CreateChildMenuItemContainerRuleDto,
        ] as CreateChildMenuItemContainerRuleDto[];
        const dto = {
            mode: 'create',
            containerRuleDtos: ruleDtos,
            validQuantity: 3,
        } as CreateChildMenuItemContainerOptionsDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`container option contains duplicate rules for the same menuItem`);
    });

    it('should pass update', async () => {
        const toUpdateRequest = await containerService.findAll({ relations: ['containerRules'] });
        if (!toUpdateRequest) { throw new Error(); }

        const toUpdate = toUpdateRequest.items[0];

        const itemA = await itemService.findOneByName(item_a, ['validSizes']);
        if (!itemA) { throw new Error(); }

        const itemB = await itemService.findOneByName(item_b, ['validSizes']);
        if (!itemB) { throw new Error(); }

        const ruleDtos = [
            {
                mode: 'create',
                validMenuItemId: itemA.id,
                validSizeIds: [itemA.validSizes[0].id],
            } as CreateChildMenuItemContainerRuleDto,
            {
                mode: 'update',
                id: toUpdate.containerRules[0].id,
                validMenuItemId: itemB.id,
                validSizeIds: [itemB.validSizes[0].id],
            } as UpdateChildMenuItemContainerRuleDto,
        ] as (CreateChildMenuItemContainerRuleDto | UpdateChildMenuItemContainerRuleDto)[];

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containerRuleDtos: ruleDtos,
            validQuantity: 4,
        } as UpdateChildMenuItemContainerOptionsDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update: duplicate item rules', async () => {
        const toUpdateRequest = await containerService.findAll({ relations: ['containerRules'] });
        if (!toUpdateRequest) { throw new Error(); }

        const toUpdate = toUpdateRequest.items[0];

        const itemA = await itemService.findOneByName(item_a, ['validSizes']);
        if (!itemA) { throw new Error(); }

        const itemB = await itemService.findOneByName(item_a, ['validSizes']);
        if (!itemB) { throw new Error(); }

        const ruleDtos = [
            {
                mode: 'create',
                validMenuItemId: itemA.id,
                validSizeIds: [itemA.validSizes[0].id],
            } as CreateChildMenuItemContainerRuleDto,
            {
                mode: 'update',
                id: toUpdate.containerRules[0].id,
                validMenuItemId: itemB.id,
                validSizeIds: [itemB.validSizes[0].id],
            } as UpdateChildMenuItemContainerRuleDto,
            {
                mode: 'update',
                id: toUpdate.containerRules[0].id,
                validMenuItemId: itemB.id,
                validSizeIds: [itemB.validSizes[1].id],
            } as UpdateChildMenuItemContainerRuleDto,
        ] as (CreateChildMenuItemContainerRuleDto | UpdateChildMenuItemContainerRuleDto)[];

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containerRuleDtos: ruleDtos,
            validQuantity: 4,
        } as UpdateChildMenuItemContainerOptionsDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual('container option contains duplicate rules for the same menuItem');
    });

});