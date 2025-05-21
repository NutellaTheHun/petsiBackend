import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { type_a, type_b } from "../../labels/utils/constants";
import { CreateChildMenuItemContainerItemDto } from "../dto/menu-item-container-item/create-child-menu-item-container-item.dto";
import { UpdateChildMenuItemContainerItemDto } from "../dto/menu-item-container-item/update-child-menu-item-container-item.dto";
import { MenuItemContainerItemService } from "../services/menu-item-container-item.service";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemContainerItemValidator } from "./menu-item-container-item.validator";
import { MenuItemService } from "../services/menu-item.service";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { FOOD_A } from "../../inventory-items/utils/constants";
import { item_a, item_c, SIZE_FOUR, SIZE_ONE, SIZE_THREE } from "../utils/constants";

describe('menu item container item validator', () => {
    let testingUtil: MenuItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: MenuItemContainerItemValidator;
    let containerService: MenuItemContainerItemService;
    let itemService: MenuItemService;
    let sizeService: MenuItemSizeService;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        validator = module.get<MenuItemContainerItemValidator>(MenuItemContainerItemValidator);
        containerService = module.get<MenuItemContainerItemService>(MenuItemContainerItemService);
        itemService = module.get<MenuItemService>(MenuItemService);
        sizeService = module.get<MenuItemSizeService>(MenuItemSizeService);

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
        const parentContainer = await itemService.findOneByName(item_c, ['validSizes']);
        if(!parentContainer){ throw new Error(); }

        const containedItem = await itemService.findOneByName(item_a, ['validSizes']);
        if(!containedItem){ throw new Error(); }

        const dto = {
            mode: 'create',
            parentContainerId: parentContainer.id,
            parentContainerSizeId: parentContainer.validSizes[0].id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: containedItem.validSizes[0].id,
            quantity: 1,
        } as CreateChildMenuItemContainerItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create: invalid size for item', async () => {
        const parentContainer = await itemService.findOneByName(item_c, ['validSizes']);
        if(!parentContainer){ throw new Error(); }

        const containedItem = await itemService.findOneByName(item_a, ['validSizes']);
        if(!containedItem){ throw new Error(); }

        const badSize = await sizeService.findOneByName(SIZE_FOUR);
        if(!badSize){ throw new Error(); }

        const dto = {
            mode: 'create',
            parentContainerId: parentContainer.id,
            parentContainerSizeId: parentContainer.validSizes[0].id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: badSize.id,
            quantity: 1,
        } as CreateChildMenuItemContainerItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`size ${badSize.name} with id ${badSize.id} is invalid for contained item ${containedItem.itemName} with id ${containedItem.id}`);
    });

    it('should fail create: invalid parent size for parent item', async () => {
        const parentContainer = await itemService.findOneByName(item_c, ['validSizes']);
        if(!parentContainer){ throw new Error(); }

        const containedItem = await itemService.findOneByName(item_a, ['validSizes']);
        if(!containedItem){ throw new Error(); }

        const badSize = await sizeService.findOneByName(SIZE_FOUR);
        if(!badSize){ throw new Error(); }

        const dto = {
            mode: 'create',
            parentContainerId: parentContainer.id,
            parentContainerSizeId: badSize.id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: containedItem.validSizes[0].id,
            quantity: 1,
        } as CreateChildMenuItemContainerItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`size ${badSize.name} with id ${badSize.id} is invalid for parent container item ${parentContainer.itemName} with id ${parentContainer.id}`);
    });

    it('should pass update', async () => {
        const toUpdateRequest = await containerService.findAll();
        if(!toUpdateRequest){ throw new Error(); }

        const toUpdate = toUpdateRequest.items[0];

        const parentContainer = await itemService.findOneByName(item_c, ['validSizes']);
        if(!parentContainer){ throw new Error(); }

        const containedItem = await itemService.findOneByName(item_a, ['validSizes']);
        if(!containedItem){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: containedItem.validSizes[0].id,
            quantity: 2,
        } as UpdateChildMenuItemContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update: new item with no sizing', async () => {
        const toUpdateRequest = await containerService.findAll();
        if(!toUpdateRequest){ throw new Error(); }

        const toUpdate = toUpdateRequest.items[0];

        const containedItem = await itemService.findOneByName(item_a, ['validSizes']);
        if(!containedItem){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containedMenuItemId: containedItem.id,
            quantity: 3,
        } as UpdateChildMenuItemContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual('updating menu item must be accompanied by new menuItemSize');
    });

    it('should fail update: invalid contained item and size', async () => {
        const toUpdateRequest = await containerService.findAll();
        if(!toUpdateRequest){ throw new Error(); }

        const toUpdate = toUpdateRequest.items[0];

        const containedItem = await itemService.findOneByName(item_a, ['validSizes']);
        if(!containedItem){ throw new Error(); }
        
        const badSize = await sizeService.findOneByName(SIZE_FOUR);
        if(!badSize){ throw new Error(); }


        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: badSize.id,
            quantity: 3,
        } as UpdateChildMenuItemContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`size ${badSize.name} with id ${badSize.id} is invalid for contained item ${containedItem.itemName} with id ${containedItem.id}`);
    });

    it('should fail update: invalid size for currentItem', async () => {
        const toUpdateRequest = await containerService.findAll({ relations: ['containedItem'] });
        if(!toUpdateRequest){ throw new Error(); }

        const toUpdate = toUpdateRequest.items[0];

        const containedItem = await itemService.findOneByName(item_a, ['validSizes']);
        if(!containedItem){ throw new Error(); }
        
        const badSize = await sizeService.findOneByName(SIZE_FOUR);
        if(!badSize){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containedMenuItemSizeId: badSize.id,
            quantity: 3,
        } as UpdateChildMenuItemContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`size ${badSize.name} with id ${badSize.id} is invalid for current item ${toUpdate.containedItem.itemName} with id ${toUpdate.containedItem.id}`);
    });

});