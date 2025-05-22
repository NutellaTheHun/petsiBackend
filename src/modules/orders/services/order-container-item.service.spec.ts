import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { item_f } from "../../menu-items/utils/constants";
import { CreateOrderContainerItemDto } from "../dto/order-container-item/create-order-container-item.dto";
import { UpdateOrderContainerItemDto } from "../dto/order-container-item/update-order-container-item.dto";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { OrderContainerItemService } from "./order-container-item.service";
import { OrderMenuItemService } from "./order-menu-item.service";
import { MenuItemContainerOptionsService } from "../../menu-items/services/menu-item-container-options.service";

describe('order container item service', () => {
    let service: OrderContainerItemService;
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let menuItemService: MenuItemService;
    let orderItemService: OrderMenuItemService;
    let optionService: MenuItemContainerOptionsService;

    let testId: number;
    let testIds: number[];

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        dbTestContext = new DatabaseTestContext();
        await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

        service = module.get<OrderContainerItemService>(OrderContainerItemService);
        menuItemService = module.get<MenuItemService>(MenuItemService);
        orderItemService = module.get<OrderMenuItemService>(OrderMenuItemService);
        optionService = module.get<MenuItemContainerOptionsService>(MenuItemContainerOptionsService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should fail to create a container item', async () => {
        const dto = {
        } as CreateOrderContainerItemDto;

        const result = await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should find all container items', async () => {
        const results = await service.findAll();

        expect(results).not.toBeNull();

        testIds = results.items.slice(0,3).map(type => type.id);

        testId = results.items[0].id;
    });

    it('should find a container item by id', async () => {
        const result = await service.findOne(testId);
        
        expect(result).not.toBeNull();
        expect(result?.id).toEqual(testId);
    });

    it('should update item', async () => {
        const toUpdate = await service.findOne(testId, ['parentOrderItem']);
        if(!toUpdate){ throw new Error(); }

        const parentOrderItem = await orderItemService.findOne(toUpdate.parentOrderItem.id, ['menuItem']);
        if(!parentOrderItem){ throw new Error(); }

        const parentMenuItem = await menuItemService.findOne(parentOrderItem.menuItem.id, ['validSizes', 'containerOptions']);
        if(!parentMenuItem){ throw new Error(); }
        if(!parentMenuItem.containerOptions){ throw new Error(); }
        
        const options = await optionService.findOne(parentMenuItem.containerOptions.id);

        const dto = {
            parentContainerMenuItemId: parentMenuItem.id,
            containedMenuItemId: options.containerRules[0].validItem.id,
            containedMenuItemSizeId: options.containerRules[0].validSizes[0].id,
        } as UpdateOrderContainerItemDto;

        const result = await service.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result.containedItem.id).toEqual(options.containerRules[0].validItem.id);
        expect(result.containedItemSize.id).toEqual(options.containerRules[0].validSizes[0].id);
    });

    it('should update quantity', async () => {
        const dto = {
            quantity: 50,
        } as UpdateOrderContainerItemDto;

        const result = await service.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result.quantity).toEqual(50);
    });

    it('should get order container items by list of ids', async () => {
        const results = await service.findEntitiesById(testIds);

        expect(results).not.toBeNull();
        expect(results.length).toEqual(testIds.length);
    });

    it('should remove a container item', async () => {
        const removal = await service.remove(testId);
        expect(removal).toBeTruthy();

        await expect(service.findOne(testId)).rejects.toThrow(NotFoundException);
    });
});