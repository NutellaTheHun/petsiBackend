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

describe('order container item validator', () => {
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: OrderContainerItemValidator;
    let containerService: OrderContainerItemService;
    let menuItemService: MenuItemService;
    let sizeService: MenuItemSizeService;
    let optionsService: MenuItemContainerOptionsService;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        validator = module.get<OrderContainerItemValidator>(OrderContainerItemValidator);
        containerService = module.get<OrderContainerItemService>(OrderContainerItemService);
        menuItemService = module.get<MenuItemService>(MenuItemService);
        sizeService = module.get<MenuItemSizeService>(MenuItemSizeService);
        optionsService = module.get<MenuItemContainerOptionsService>(MenuItemContainerOptionsService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        await testingUtil.initOrderTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });
    
    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'parentOrderItem.menuItem'] });
        if(!containerItemRequest){ throw new Error(); }
        const parentItem = containerItemRequest.items[0].parentOrderItem;
        if(!parentItem.menuItem){ throw new Error(); }

        const parentMenuItem = await menuItemService.findOne(parentItem.menuItem.id, ['containerOptions']);

        const options = parentMenuItem.containerOptions;

        const contItemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!contItemB){ throw new Error(); }

        const dto = {
            mode: 'create',
            parentContainerMenuItemId: parentMenuItem.id,
            containedMenuItemId: options?.containerRules[0].validItem.id,
            containedMenuItemSizeId: options?.containerRules[0].validSizes[0].id,
            quantity: 1,
        } as CreateChildOrderContainerItemDto

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create: invalid dto item for container', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'parentOrderItem.menuItem'] });
        if(!containerItemRequest){ throw new Error(); }
        const parentItem = containerItemRequest.items[0].parentOrderItem;
        if(!parentItem.menuItem){ throw new Error(); }
        const parentMenuItem = await menuItemService.findOne(parentItem.menuItem.id, ['containerOptions']);

        const options = parentMenuItem.containerOptions;
        const validItemIds = options?.containerRules.map(item => item.id);

        const menuItems = (await menuItemService.findAll({ relations: ['validSizes']})).items;
        if(!menuItems){ throw new Error(); }

        const badItems = menuItems.filter(item => !validItemIds?.find(validItemId => validItemId === item.id))

        const dto = {
            mode: 'create',
            parentContainerMenuItemId: parentMenuItem.id,
            containedMenuItemId: badItems[0].id,
            containedMenuItemSizeId: badItems[0].validSizes[0].id,
            quantity: 1,
        } as CreateChildOrderContainerItemDto

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`Order category with name ${TYPE_A} already exists`);
    });

    it('should fail create: invalid dto size for container', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'parentOrderItem.menuItem'] });
        if(!containerItemRequest){ throw new Error(); }

        const parentItem = containerItemRequest.items[0].parentOrderItem;
        if(!parentItem.menuItem){ throw new Error(); }
        const parentMenuItem = await menuItemService.findOne(parentItem.menuItem.id, ['containerOptions']);

        const options = parentMenuItem.containerOptions;
        if(!options?.containerRules){ throw new Error(); }

        const containedItem = await menuItemService.findOne(options.containerRules[0].validItem.id, ['validSizes']);
        if(!containedItem){ throw new Error(); }

        const validItemSizeIds = options.containerRules[0].validSizes.map(item => item.id);

        const badSizes = containedItem.validSizes.filter( validSize => 
                            !validItemSizeIds.find(optionsSizeId => optionsSizeId === validSize.id));

        const dto = {
            mode: 'create',
            parentContainerMenuItemId: parentMenuItem.id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: badSizes[0].id,
            quantity: 1,
        } as CreateChildOrderContainerItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`Order category with name ${TYPE_A} already exists`);
    });

    it('should fail create: invalid dto size for dto item', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'parentOrderItem.menuItem'] });
        if(!containerItemRequest){ throw new Error(); }
        const parentItem = containerItemRequest.items[0].parentOrderItem;
        if(!parentItem.menuItem){ throw new Error(); }
        const parentMenuItem = await menuItemService.findOne(parentItem.menuItem.id, ['containerOptions']);

        const options = parentMenuItem.containerOptions;
        if(!options){ throw new Error(); }
        const containedItem = await menuItemService.findOne(options.containerRules[0].validItem.id, ['validSizes']);
        if(!containedItem){ throw new Error(); }
        
        const badItem = await menuItemService.findOneByName(item_f, ['validSizes']);
        if(!badItem){ throw new Error(); }

        const dto = {
            mode: 'create',
            parentContainerMenuItemId: parentMenuItem.id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: badItem.validSizes[0].id,
            quantity: 1,
        } as CreateChildOrderContainerItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`Order category with name ${TYPE_A} already exists`);
    });

    it('should pass update', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'parentOrderItem.menuItem'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const parentItem = toUpdate.parentOrderItem;
        if(!parentItem.menuItem){ throw new Error(); }

        const parentMenuItem = await menuItemService.findOne(parentItem.menuItem.id, ['containerOptions']);

        const options = parentMenuItem.containerOptions;
        if(!options?.containerRules){ throw new Error(); }

        const contItemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!contItemB){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            parentContainerMenuItemId: parentItem.id,
            containedMenuItemId: options.containerRules[0].validItem.id,
            containedMenuItemSizeId: options.containerRules[0].validSizes[0].id,
            quantity: 1,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update: item update with no parent id', async () => {
         const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'parentOrderItem.menuItem'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const parentItem = toUpdate.parentOrderItem;
        if(!parentItem.menuItem){ throw new Error(); }

        const parentMenuItem = await menuItemService.findOne(parentItem.menuItem.id, ['containerOptions']);

        const options = parentMenuItem.containerOptions;
        if(!options?.containerRules){ throw new Error(); }

        const contItemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!contItemB){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containedMenuItemId: options.containerRules[0].validItem.id,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Order category with name ${TYPE_B} already exists`);
    });

    it('should fail update: size update with no parent id', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'parentOrderItem.menuItem'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const parentItem = toUpdate.parentOrderItem;
        if(!parentItem.menuItem){ throw new Error(); }

        const parentMenuItem = await menuItemService.findOne(parentItem.menuItem.id, ['containerOptions']);

        const options = parentMenuItem.containerOptions;
        if(!options?.containerRules){ throw new Error(); }

        const contItemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!contItemB){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containedMenuItemSizeId: options.containerRules[0].validSizes[0].id,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Order category with name ${TYPE_B} already exists`);
    });

    it('should fail update DTO ITEM AND SIZE: item and size update with no parent id', async () => {
         const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'parentOrderItem.menuItem'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const parentItem = toUpdate.parentOrderItem;
        if(!parentItem.menuItem){ throw new Error(); }

        const parentMenuItem = await menuItemService.findOne(parentItem.menuItem.id, ['containerOptions']);

        const options = parentMenuItem.containerOptions;
        if(!options?.containerRules){ throw new Error(); }

        const contItemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!contItemB){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containedMenuItemId: options.containerRules[0].validItem.id,
            containedMenuItemSizeId: options.containerRules[0].validSizes[0].id,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Order category with name ${TYPE_B} already exists`);
    });

    it('should fail update DTO ITEM AND SIZE: invalid dto item for container', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'parentOrderItem.menuItem'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const parentItem = toUpdate.parentOrderItem;
        if(!parentItem.menuItem){ throw new Error(); }

        const parentMenuItem = await menuItemService.findOne(parentItem.menuItem.id, ['containerOptions']);

        const options = parentMenuItem.containerOptions;
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
            parentContainerMenuItemId: parentItem.id,
            containedMenuItemId: badItems[0].id,
            containedMenuItemSizeId: badItems[0].validSizes[0].id,
            quantity: 1,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Order category with name ${TYPE_B} already exists`);
    });

    it('should fail update DTO ITEM AND SIZE: invalid dto size for container', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'parentOrderItem.menuItem'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const parentItem = toUpdate.parentOrderItem;
        if(!parentItem.menuItem){ throw new Error(); }

        const parentMenuItem = await menuItemService.findOne(parentItem.menuItem.id, ['containerOptions']);

        const options = parentMenuItem.containerOptions;
        if(!options?.containerRules){ throw new Error(); }

        const containedItem = await menuItemService.findOne(options.containerRules[0].validItem.id, ['validSizes']);
        if(!containedItem){ throw new Error(); }

        const validItemSizeIds = options.containerRules[0].validSizes.map(item => item.id);

        const badSizes = containedItem.validSizes.filter( validSize => 
                            !validItemSizeIds.find(optionsSizeId => optionsSizeId === validSize.id));

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            parentContainerMenuItemId: parentItem.id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: badSizes[0].id,
            quantity: 1,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Order category with name ${TYPE_B} already exists`);
    });

    it('should fail update DTO ITEM AND SIZE: invalid dto size for dto item', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'parentOrderItem.menuItem'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const parentItem = toUpdate.parentOrderItem;
        if(!parentItem.menuItem){ throw new Error(); }

        const parentMenuItem = await menuItemService.findOne(parentItem.menuItem.id, ['containerOptions']);

        const options = parentMenuItem.containerOptions;
        if(!options){ throw new Error(); }
        const containedItem = await menuItemService.findOne(options.containerRules[0].validItem.id, ['validSizes']);
        if(!containedItem){ throw new Error(); }
        
        const badItem = await menuItemService.findOneByName(item_f, ['validSizes']);
        if(!badItem){ throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            parentContainerMenuItemId: parentItem.id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: badItem.validSizes[0].id,
            quantity: 1,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Order category with name ${TYPE_B} already exists`);
    });

    it('should fail update DTO ITEM: invalid dto item for CURRENT size', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'parentOrderItem.menuItem', 'containedItemSize'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const itemsRequest = await menuItemService.findAll({ relations: ['validSizes']});
        if(!itemsRequest){ throw new Error(); }

        const badItems = itemsRequest.items.filter( item => !item.validSizes.find(size => size.id === toUpdate.containedItemSize.id))

        const dto = {
            mode: 'update',
            parentContainerMenuItemId: toUpdate.id,
            containedMenuItemId: badItems[0].id,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Order category with name ${TYPE_B} already exists`);
    });

    it('should fail update DTO ITEM: invalid dto size for CURRENT item', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'containedItem', 'containedItemSize'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const currentItem = await menuItemService.findOne(toUpdate.containedItem.id, ['validSizes']);
        if(!currentItem){ throw new Error(); }

        const sizeRequest = await sizeService.findAll();
        if(!sizeRequest){ throw new Error(); }

        const badSizes = sizeRequest.items.filter(size => !currentItem.validSizes.find(validSize => size.id === validSize.id));

        const dto = {
            mode: 'update',
            parentContainerMenuItemId: toUpdate.id,
            containedMenuItemSizeId: badSizes[0].id,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Order category with name ${TYPE_B} already exists`);
    });

    it('should fail update DTO ITEM: invalid dto item for container', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'parentOrderItem.menuItem', 'containedItem', 'containedItemSize'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const parentMenuItem = await menuItemService.findOne(toUpdate.parentOrderItem.menuItem.id, ['containerOptions']);

        const options = parentMenuItem.containerOptions;
        if(!options?.containerRules){ throw new Error(); }
        const validItemIds = options?.containerRules.map(item => item.id);

        const menuItems = (await menuItemService.findAll({ relations: ['validSizes']})).items;
        if(!menuItems){ throw new Error(); }

        const badItems = menuItems.filter(item => !validItemIds?.find(validItemId => validItemId === item.id));

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containedMenuItemId: badItems[0].id,
            containedMenuItemSizeId: badItems[0].validSizes[0].id,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Order category with name ${TYPE_B} already exists`);
    });

    it('should fail update DTO ITEM: invalid CURRENT size not in the dto item rules', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'parentOrderItem.menuItem', 'containedItem', 'containedItemSize'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const parentMenuItem = await menuItemService.findOne(toUpdate.parentOrderItem.menuItem.id, ['containerOptions']);

        const options = parentMenuItem.containerOptions;
        if(!options?.containerRules){ throw new Error(); }
        const validItemIds = options.containerRules.map(rule => rule.validItem.id);

        const menuItems = await menuItemService.findEntitiesById(validItemIds, ['validSizes']);

        const badItems = menuItems.filter(item => !item.validSizes.find(size => size.id === toUpdate.containedItemSize.id));

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containedMenuItemId: badItems[0].id,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Order category with name ${TYPE_B} already exists`);
    });

    it('should fail update DTO SIZE: invalid DTO size with CURRENT item', async () => {
        const containerItemRequest = await containerService.findAll({ relations: ['parentOrderItem', 'parentOrderItem.menuItem', 'containedItem', 'containedItemSize'] });
        if(!containerItemRequest){ throw new Error(); }

        const toUpdate = containerItemRequest.items[0];

        const parentMenuItem = await menuItemService.findOne(toUpdate.parentOrderItem.menuItem.id, ['containerOptions']);

        const options = parentMenuItem.containerOptions;
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
            containedMenuItemSizeId: badSizes[0].id,
        } as UpdateChildOrderContainerItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Order category with name ${TYPE_B} already exists`);
    });
});