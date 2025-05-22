import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { MenuItemContainerOptionsService } from "../../menu-items/services/menu-item-container-options.service";
import { MenuItemSizeService } from "../../menu-items/services/menu-item-size.service";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { item_b, item_f } from "../../menu-items/utils/constants";
import { CreateChildOrderContainerItemDto } from "../dto/order-container-item/create-child-order-container-item.dto";
import { UpdateChildOrderContainerItemDto } from "../dto/order-container-item/update-child-order-container-item.dto";
import { OrderContainerItemService } from "../services/order-container-item.service";
import { TYPE_A, TYPE_B } from "../utils/constants";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { OrderContainerItemValidator } from "./order-container-item.validator";
import { rule } from "postcss";
import { OrderMenuItemService } from "../services/order-menu-item.service";

describe('order container item validator', () => {
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: OrderContainerItemValidator;
    let containerService: OrderContainerItemService;
    let orderItemService: OrderMenuItemService;
    let menuItemService: MenuItemService;
    let sizeService: MenuItemSizeService;
    let optionsService: MenuItemContainerOptionsService;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        validator = module.get<OrderContainerItemValidator>(OrderContainerItemValidator);
        containerService = module.get<OrderContainerItemService>(OrderContainerItemService);
        orderItemService = module.get<OrderMenuItemService>(OrderMenuItemService);
        menuItemService = module.get<MenuItemService>(MenuItemService);
        sizeService = module.get<MenuItemSizeService>(MenuItemSizeService);
        optionsService = module.get<MenuItemContainerOptionsService>(MenuItemContainerOptionsService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });
    
    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
        const items = (await menuItemService.findAll({ relations: ['containerOptions'] })).items;

        const itemsWithOptions = items.filter(item => item.containerOptions !== null && item.containerOptions !== undefined);

        if(!itemsWithOptions[0].containerOptions){ throw new Error(); }
        const options = await optionsService.findOne(itemsWithOptions[0].containerOptions.id);
        if(!options){ throw new Error(); }

        const dto = {
            mode: 'create',
            parentContainerMenuItemId: itemsWithOptions[0].id,
            containedMenuItemId: options?.containerRules[0].validItem.id,
            containedMenuItemSizeId: options?.containerRules[0].validSizes[0].id,
            quantity: 1,
        } as CreateChildOrderContainerItemDto

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create: invalid dto item for container', async () => {
        const items = (await menuItemService.findAll({ relations: ['containerOptions'] })).items;

        const itemsWithOptions = items.filter(item => item.containerOptions !== null && item.containerOptions !== undefined);

        if(!itemsWithOptions[0].containerOptions){ throw new Error(); }
        const options = await optionsService.findOne(itemsWithOptions[0].containerOptions.id);
        if(!options){ throw new Error(); }
        const validItemIds = options?.containerRules.map(item => item.validItem.id);

        const menuItems = (await menuItemService.findAll({ relations: ['validSizes'] })).items;
        const badItems = menuItems.filter(item => !validItemIds?.includes(item.id))

        const dto = {
            mode: 'create',
            parentContainerMenuItemId: itemsWithOptions[0].id,
            containedMenuItemId: badItems[0].id,
            containedMenuItemSizeId: badItems[0].validSizes[0].id,
            quantity: 1,
        } as CreateChildOrderContainerItemDto

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`item in dto is not valid for container`);
    });

    it('should fail create: invalid dto size for container', async () => {
        const items = (await menuItemService.findAll({ relations: ['containerOptions'] })).items;

        const itemsWithOptions = items.filter(item => item.containerOptions !== null && item.containerOptions !== undefined);
        if(!itemsWithOptions[0].containerOptions){ throw new Error(); }

        const options = await optionsService.findOne(itemsWithOptions[0].containerOptions.id);
        if(!options){ throw new Error(); }
        if(!options?.containerRules){ throw new Error(); }

        const containedItem = await menuItemService.findOne(options.containerRules[0].validItem.id, ['validSizes']);
        if(!containedItem){ throw new Error(); }

        const validItemSizeIds = options.containerRules[0].validSizes.map(size => size.id);

        const badSizes = containedItem.validSizes.filter( validSize => 
                            !validItemSizeIds.find(optionsSizeId => optionsSizeId === validSize.id));

        const dto = {
            mode: 'create',
            parentContainerMenuItemId: itemsWithOptions[0].id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: badSizes[0].id,
            quantity: 1,
        } as CreateChildOrderContainerItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`dto size ${badSizes[0].name} with id ${badSizes[0].id} is not valid in the parent container item ${itemsWithOptions[0].itemName} with id ${itemsWithOptions[0].id}`);
    });

    it('should fail create: invalid dto size for dto item', async () => {
        const items = (await menuItemService.findAll({ relations: ['containerOptions'] })).items;

        const itemsWithOptions = items.filter(item => item.containerOptions !== null && item.containerOptions !== undefined);
        if(!itemsWithOptions[0].containerOptions){ throw new Error(); }

        const options = await optionsService.findOne(itemsWithOptions[0].containerOptions.id);
        if(!options){ throw new Error(); }
        if(!options?.containerRules){ throw new Error(); }

        const containedItem = await menuItemService.findOne(options.containerRules[0].validItem.id, ['validSizes']);
        if(!containedItem){ throw new Error(); }
        
        const badItem = await menuItemService.findOneByName(item_f, ['validSizes']);
        if(!badItem){ throw new Error(); }

        const dto = {
            mode: 'create',
            parentContainerMenuItemId: itemsWithOptions[0].id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: badItem.validSizes[0].id,
            quantity: 1,
        } as CreateChildOrderContainerItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`dto size ${badItem.validSizes[0].name} with id ${badItem.validSizes[0].id} is not valid for the contained item ${containedItem.itemName} with id ${containedItem.id}`);
    });

    it('should pass update', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];
        
        const items = (await menuItemService.findAll({ relations: ['containerOptions'] })).items;

        const itemsWithOptions = items.filter(item => item.containerOptions !== null && item.containerOptions !== undefined);
        if(!itemsWithOptions[0].containerOptions){ throw new Error(); }

        const options = await optionsService.findOne(itemsWithOptions[0].containerOptions.id);
        if(!options){ throw new Error(); }
        if(!options?.containerRules){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            parentContainerMenuItemId: itemsWithOptions[0].id,
            containedMenuItemId: options.containerRules[0].validItem.id,
            containedMenuItemSizeId: options.containerRules[0].validSizes[0].id,
            quantity: 1,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update: item update with no parent id', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];
        
        const contItemB = await menuItemService.findOneByName(item_b);
        if(!contItemB){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containedMenuItemId: contItemB.id,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual('dto requires the parentContainerMenuItemId for validation');
    });

    it('should fail update: size update with no parent id', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];
        
        const contItemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!contItemB){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containedMenuItemSizeId: contItemB.validSizes[0].id,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual('dto requires the parentContainerMenuItemId for validation');
    });

    it('should fail update DTO ITEM AND SIZE: item and size update with no parent id', async () => {
         const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const contItemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!contItemB){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containedMenuItemId: contItemB.id,
            containedMenuItemSizeId: contItemB.validSizes[0].id,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`dto requires the parentContainerMenuItemId for validation`);
    });

    it('should fail update DTO ITEM AND SIZE: invalid dto item for container', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const items = (await menuItemService.findAll({ relations: ['containerOptions'] })).items;

        const itemsWithOptions = items.filter(item => item.containerOptions);
        if(!itemsWithOptions[0].containerOptions){ throw new Error(); }

        const options = await optionsService.findOne(itemsWithOptions[0].containerOptions.id);
        if(!options){ throw new Error(); }
        if(!options?.containerRules){ throw new Error(); }

        const validItemIds = options?.containerRules.map(item => item.id);

        const contItemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!contItemB){ throw new Error(); }

        const menuItems = (await menuItemService.findAll({ relations: ['validSizes']})).items;
        if(!menuItems){ throw new Error(); }

        const badItems = menuItems.filter(item => !validItemIds?.find(validItemId => validItemId === item.id));

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            parentContainerMenuItemId: itemsWithOptions[0].id,
            containedMenuItemId: badItems[0].id,
            containedMenuItemSizeId: badItems[0].validSizes[0].id,
            quantity: 1,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`dto size ${badItems[0].validSizes[0].name} with id ${badItems[0].validSizes[0].id} is not valid in the parent container item ${itemsWithOptions[0].itemName} with id ${itemsWithOptions[0].id}`);
    });

    it('should fail update DTO ITEM AND SIZE: invalid dto size for container', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const items = (await menuItemService.findAll({ relations: ['containerOptions'] })).items;

        const itemsWithOptions = items.filter(item => item.containerOptions);
        if(!itemsWithOptions[0].containerOptions){ throw new Error(); }

        const options = await optionsService.findOne(itemsWithOptions[0].containerOptions.id);
        if(!options){ throw new Error(); }
        if(!options?.containerRules){ throw new Error(); }

        const containedItem = await menuItemService.findOne(options.containerRules[0].validItem.id, ['validSizes']);
        if(!containedItem){ throw new Error(); }

        const validItemSizeIds = options.containerRules[0].validSizes.map(item => item.id);

        const badSizes = containedItem.validSizes.filter( validSize => 
                            !validItemSizeIds.find(optionsSizeId => optionsSizeId === validSize.id));

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            parentContainerMenuItemId: itemsWithOptions[0].id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: badSizes[0].id,
            quantity: 1,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`dto size ${badSizes[0].name} with id ${badSizes[0].id} is not valid in the parent container item ${itemsWithOptions[0].itemName} with id ${itemsWithOptions[0].id}`);
    });

    it('should fail update DTO ITEM AND SIZE: invalid dto size for dto item', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const items = (await menuItemService.findAll({ relations: ['containerOptions'] })).items;

        const itemsWithOptions = items.filter(item => item.containerOptions);
        if(!itemsWithOptions[0].containerOptions){ throw new Error(); }

        const options = await optionsService.findOne(itemsWithOptions[0].containerOptions.id);
        if(!options){ throw new Error(); }
        if(!options?.containerRules){ throw new Error(); }

        const containedItem = await menuItemService.findOne(options.containerRules[0].validItem.id, ['validSizes']);
        if(!containedItem){ throw new Error(); }
        
        const badItem = await menuItemService.findOneByName(item_f, ['validSizes']);
        if(!badItem){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            parentContainerMenuItemId: itemsWithOptions[0].id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: badItem.validSizes[0].id,
            quantity: 1,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`dto size ${badItem.validSizes[0].name} with id ${badItem.validSizes[0].id} is not valid for the current item ${containedItem.itemName} with id ${containedItem.id}`);
    });

    it('should fail update DTO ITEM: invalid dto item for CURRENT size', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'containedItemSize'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const items = (await menuItemService.findAll({ relations: ['containerOptions'] })).items;

        const itemsWithOptions = items.filter(item => item.containerOptions);
        if(!itemsWithOptions[0].containerOptions){ throw new Error(); }

        const options = await optionsService.findOne(itemsWithOptions[0].containerOptions.id);
        if(!options){ throw new Error(); }
        if(!options?.containerRules){ throw new Error(); }

        const itemsRequest = await menuItemService.findAll({ relations: ['validSizes']});
        if(!itemsRequest){ throw new Error(); }

        const badItems = itemsRequest.items.filter( item => !item.validSizes.find(size => size.id === toUpdate.containedItemSize.id))

        const dto = {
            mode: 'update',
            parentContainerMenuItemId: itemsWithOptions[0].id,
            containedMenuItemId: badItems[0].id,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`dto size ${toUpdate.containedItemSize.name} with id ${toUpdate.containedItemSize.id} is not valid for the current item ${badItems[0].itemName} with id ${badItems[0].id}`);
    });

    it('should fail update DTO ITEM: invalid dto item for container', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'containedItemSize'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const items = (await menuItemService.findAll({ relations: ['containerOptions'] })).items;

        const itemsWithOptions = items.filter(item => item.containerOptions);
        if(!itemsWithOptions[0].containerOptions){ throw new Error(); }

        const options = await optionsService.findOne(itemsWithOptions[0].containerOptions.id);
        if(!options){ throw new Error(); }
        if(!options?.containerRules){ throw new Error(); }

        const validItemIds = options.containerRules.map(rule => rule.validItem.id);

        const menuItems = (await menuItemService.findAll({ relations: ['validSizes']})).items;
        if(!menuItems){ throw new Error(); }

        const badItems = menuItems.filter(item => !validItemIds?.find(validItemId => validItemId === item.id));

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            parentContainerMenuItemId: itemsWithOptions[0].id,
            containedMenuItemId: badItems[0].id,
            containedMenuItemSizeId: badItems[0].validSizes[0].id,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`item in dto is not valid for container`);
    });

    it('should fail update DTO SIZE: invalid DTO size with CURRENT item', async () => {
         const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'containedItemSize', 'containedItem'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const items = (await menuItemService.findAll({ relations: ['containerOptions'] })).items;

        const itemsWithOptions = items.filter(item => item.containerOptions);
        if(!itemsWithOptions[0].containerOptions){ throw new Error(); }

        const options = await optionsService.findOne(itemsWithOptions[0].containerOptions.id);
        if(!options){ throw new Error(); }
        if(!options?.containerRules){ throw new Error(); }

        const rule = options.containerRules.find(rule => rule.validItem.id === toUpdate.containedItem.id);
        if(!rule){ throw new Error(); }
        
        const currentItem = await menuItemService.findOne(toUpdate.containedItem.id, ['validSizes']);
        if(!currentItem){ throw new Error(); }

        // sizes that are in validSizes but not in rule.validSizes
        const badSizes = currentItem.validSizes.filter(
            validSize => !rule.validSizes.some(
                ruleSize => ruleSize.id === validSize.id
            )
        );

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            parentContainerMenuItemId: itemsWithOptions[0].id,
            containedMenuItemSizeId: badSizes[0].id,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`dto size ${badSizes[0].name} with id ${badSizes[0].id} is not valid in the parent container item ${itemsWithOptions[0].itemName} with id ${itemsWithOptions[0].id}`);
    });
});