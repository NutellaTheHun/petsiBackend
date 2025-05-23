import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { MenuItemContainerOptionsService } from "../../menu-items/services/menu-item-container-options.service";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { item_a, item_b, item_f } from "../../menu-items/utils/constants";
import { CreateChildOrderContainerItemDto } from "../dto/order-container-item/create-child-order-container-item.dto";
import { UpdateChildOrderContainerItemDto } from "../dto/order-container-item/update-child-order-container-item.dto";
import { CreateChildOrderMenuItemDto } from "../dto/order-menu-item/create-child-order-menu-item.dto";
import { CreateOrderMenuItemDto } from "../dto/order-menu-item/create-order-menu-item.dto";
import { UpdateOrderMenuItemDto } from "../dto/order-menu-item/update-order-menu-item.dto";
import { UpdateOrderDto } from "../dto/order/update-order.dto";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { OrderContainerItemService } from "./order-container-item.service";
import { OrderMenuItemService } from "./order-menu-item.service";
import { OrderService } from "./order.service";

describe('order menu item service', () => {
    let orderItemService: OrderMenuItemService;
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext

    let orderService: OrderService;
    let componentService: OrderContainerItemService;

    let menuItemService: MenuItemService;
    let optionsService: MenuItemContainerOptionsService;

    let testId: number;
    let testIds: number[];
    let testOrderId: number;
    let testOrderItemCompsId: number;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        dbTestContext = new DatabaseTestContext();
        await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

        orderItemService = module.get<OrderMenuItemService>(OrderMenuItemService);
        orderService = module.get<OrderService>(OrderService);
        componentService = module.get<OrderContainerItemService>(OrderContainerItemService);

        menuItemService = module.get<MenuItemService>(MenuItemService);
        optionsService = module.get<MenuItemContainerOptionsService>(MenuItemContainerOptionsService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(orderItemService).toBeDefined();
    });

    it('should fail to create orderMenuItem (Bad Request) then create properly for future tests', async () => {
        const ordersRequest = await orderService.findAll();
        const testOrder = ordersRequest.items[0];
        if (!testOrder) { throw new Error(); }
        testOrderId = testOrder.id;

        const item = await menuItemService.findOneByName(item_a, ["validSizes"]);
        if (!item) { throw new NotFoundException(); }
        if (!item.validSizes) { throw new Error(); }
        if (item.validSizes.length === 0) { throw new Error(); }

        const dto = {
            orderId: testOrderId,
            menuItemId: item.id,
            menuItemSizeId: item.validSizes[0].id,
            quantity: 1,
        } as CreateOrderMenuItemDto;

        await expect(orderItemService.create(dto)).rejects.toThrow(BadRequestException);

        const createItemDto = {
            mode: 'create',
            menuItemId: item.id,
            menuItemSizeId: item.validSizes[0].id,
            quantity: 1,
        } as CreateChildOrderMenuItemDto;

        const updateOrderDto = {
            orderedMenuItemDtos: [createItemDto]
        } as UpdateOrderDto;

        const updateResult = await orderService.update(testOrderId, updateOrderDto);
        if (!updateResult) { throw new Error(); }
        if (!updateResult.orderedItems) { throw new Error(); }

        const result = updateResult.orderedItems[0];

        expect(result).not.toBeNull();
        expect(result?.order.id).toEqual(testOrderId);
        expect(result?.quantity).toEqual(1);
        expect(result?.menuItem.id).toEqual(item.id);
        expect(result?.size.id).toEqual(item.validSizes[0].id);

        testId = result?.id as number;
    });

    it('should update order query with new item', async () => {
        const testOrder = await orderService.findOne(testOrderId, ['orderedItems']);
        if (!testOrder) { throw new NotFoundException(); }
        if (!testOrder.orderedItems) { throw new Error(); }

        expect(testOrder.orderedItems.findIndex(item => item.id === testId)).not.toEqual(-1);
    });

    it('should find orderMenuItem by id', async () => {
        const result = await orderItemService.findOne(testId);

        expect(result).not.toBeNull();
        expect(result?.quantity).toEqual(1);
    });

    it('should update menuItem', async () => {
        const newItem = await menuItemService.findOneByName(item_b, ["validSizes"]);
        if (!newItem) { throw new NotFoundException(); }
        if (!newItem.validSizes) { throw new Error(); }
        if (newItem.validSizes.length < 2) { throw new Error(); }

        const dto = {
            menuItemId: newItem.id,
            menuItemSizeId: newItem.validSizes[0].id,
        } as UpdateOrderMenuItemDto;

        const result = await orderItemService.update(testId, dto);
        if (!result) { throw new Error(); }
        expect(result).not.toBeNull();
        expect(result?.menuItem.id).toEqual(newItem.id);
        expect(result?.size.id).toEqual(newItem.validSizes[0].id);
    });

    it('should update quantity', async () => {
        const dto = {
            quantity: 2,
        } as UpdateOrderMenuItemDto;

        const result = await orderItemService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.quantity).toEqual(2);
    });

    it('should update size', async () => {
        const newItem = await menuItemService.findOneByName(item_b, ["validSizes"]);
        if (!newItem) { throw new NotFoundException(); }
        if (!newItem.validSizes) { throw new Error(); }
        if (newItem.validSizes.length < 2) { throw new Error(); }

        const dto = {
            menuItemSizeId: newItem.validSizes[1].id,
        } as UpdateOrderMenuItemDto;

        const result = await orderItemService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.size.id).toEqual(newItem.validSizes[1].id);
    });

    it('should find all orderMenuItems', async () => {
        const orderItemsRequest = await orderItemService.findAll({ limit: 40 });
        const items = orderItemsRequest.items;

        testIds = [items[0].id, items[1].id, items[2].id];

        expect(items.length).toEqual(25);
    });

    it('should get orderMenuItems by list of ids', async () => {
        const results = await orderItemService.findEntitiesById(testIds);
        expect(results).not.toBeNull();
        expect(results.length).toEqual(3);
    });

    it('should remove orderMenuItem', async () => {
        const removal = await orderItemService.remove(testId);
        expect(removal).toBeTruthy();

        await expect(orderItemService.findOne(testId)).rejects.toThrow(NotFoundException);
    });

    it('should update order query to not contain deleted item', async () => {
        const testOrder = await orderService.findOne(testOrderId, ['orderedItems']);
        if (!testOrder) { throw new NotFoundException(); }
        if (!testOrder.orderedItems) { throw new Error(); }

        expect(testOrder.orderedItems.findIndex(item => item.id === testId)).toEqual(-1);
    });

    it('should create an order item with container items', async () => {
        const items = (await menuItemService.findAll({ relations: ['containerOptions', 'validSizes'], limit: 20 })).items;

        const containerItems = items.filter(item => item.containerOptions);

        if (!containerItems[0].containerOptions) { throw new Error(); }
        const options = await optionsService.findOne(containerItems[0].containerOptions.id);
        if (!options) { throw new Error(); }

        const compDtos = [
            {
                mode: 'create',
                parentContainerMenuItemId: containerItems[0].id,
                containedMenuItemId: options.containerRules[0].validItem.id,
                containedMenuItemSizeId: options.containerRules[0].validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderContainerItemDto,
        ] as CreateChildOrderContainerItemDto[];

        const orders = (await orderService.findAll({ relations: ['orderedItems'] })).items;

        const itemF = await menuItemService.findOneByName(item_f, ['validSizes']);
        if (!itemF) { throw new Error(); }
        if (!itemF.validSizes) { throw new Error(); }

        const itemDto = {
            mode: 'create',
            menuItemId: containerItems[0].id,
            menuItemSizeId: containerItems[0].validSizes[0].id,
            quantity: 1,
            orderedItemContainerDtos: compDtos,
        } as CreateChildOrderMenuItemDto;

        const updateOrderDto = {
            orderedMenuItemDtos: [itemDto]
        } as UpdateOrderDto;

        const updateResult = await orderService.update(orders[0].id, updateOrderDto);
        if (!updateResult) { throw new Error(); }
        if (!updateResult.orderedItems) { throw new Error(); }

        const result = updateResult.orderedItems[0];
        if (!result) { throw new Error(); }
        if (!result.orderedContainerItems) { throw new Error(); }
        expect(result.orderedContainerItems.length).toEqual(1);

        testOrderItemCompsId = result.id;
    });

    it('should update item container (add)', async () => {
        const toUpdate = await orderItemService.findOne(testOrderItemCompsId, ['orderedContainerItems', 'menuItem']);
        if (!toUpdate) { throw new Error(); }
        if (!toUpdate.orderedContainerItems) { throw new Error(); }

        const parentMenuItem = await menuItemService.findOne(toUpdate.menuItem.id, ['containerOptions', 'validSizes']);
        if (!parentMenuItem) { throw new Error(); }
        if (!parentMenuItem.containerOptions) { throw new Error(); }

        const options = await optionsService.findOne(parentMenuItem.containerOptions.id);
        if (!options) { throw new Error(); }

        const cDto = {
            mode: 'create',
            parentContainerMenuItemId: parentMenuItem.id,
            containedMenuItemId: options.containerRules[1].validItem.id,
            containedMenuItemSizeId: options.containerRules[1].validSizes[0].id,
            quantity: 2,
        } as CreateChildOrderContainerItemDto;

        const theRest = toUpdate.orderedContainerItems.map(comp => ({
            mode: 'update',
            id: comp.id,
        }) as UpdateChildOrderContainerItemDto);

        const dto = {
            orderedItemContainerDtos: [cDto, ...theRest],
        } as UpdateOrderMenuItemDto;

        const result = await orderItemService.update(testOrderItemCompsId, dto);
        if (!result) { throw new Error(); }
        if (!result.orderedContainerItems) { throw new Error(); }
        expect(result.orderedContainerItems.length).toEqual(toUpdate.orderedContainerItems.length + 1);
    });

    it('should update item container (modify)', async () => {
        const toUpdate = await orderItemService.findOne(testOrderItemCompsId, ['orderedContainerItems', 'menuItem']);
        if (!toUpdate) { throw new Error(); }
        if (!toUpdate.orderedContainerItems) { throw new Error(); }

        const parentMenuItem = await menuItemService.findOne(toUpdate.menuItem.id, ['containerOptions', 'validSizes']);
        if (!parentMenuItem) { throw new Error(); }
        if (!parentMenuItem.containerOptions) { throw new Error(); }

        const options = await optionsService.findOne(parentMenuItem.containerOptions.id);
        if (!options) { throw new Error(); }

        const theRest = toUpdate.orderedContainerItems.map(comp => ({
            mode: 'update',
            id: comp.id,
        }) as UpdateChildOrderContainerItemDto);

        theRest[0].containedMenuItemSizeId = options.containerRules[0].validSizes[0].id;
        theRest[0].quantity = 50;
        theRest[0].parentContainerMenuItemId = parentMenuItem.id;

        const moddedId = theRest[0].id;

        const dto = {
            orderedItemContainerDtos: theRest,
        } as UpdateOrderMenuItemDto;

        const result = await orderItemService.update(testOrderItemCompsId, dto);
        if (!result) { throw new Error(); }
        if (!result.orderedContainerItems) { throw new Error(); }
        for (const comp of result.orderedContainerItems) {
            if (comp.id === moddedId) {
                expect(comp.containedItemSize.id).toEqual(options.containerRules[0].validSizes[0].id);
                expect(comp.quantity).toEqual(50);
            }
        }
    });

    it('should update item components (remove)', async () => {
        const toUpdate = await orderItemService.findOne(testOrderItemCompsId, ['orderedContainerItems']);
        if (!toUpdate) { throw new Error(); }
        if (!toUpdate.orderedContainerItems) { throw new Error(); }

        const theRest = toUpdate.orderedContainerItems.slice(1).map(comp => ({
            mode: 'update',
            id: comp.id,
        }) as UpdateChildOrderContainerItemDto);

        const removedId = toUpdate.orderedContainerItems[0].id;

        const dto = {
            orderedItemContainerDtos: theRest,
        } as UpdateOrderMenuItemDto;

        const result = await orderItemService.update(testOrderItemCompsId, dto);
        if (!result) { throw new Error(); }
        if (!result.orderedContainerItems) { throw new Error(); }
        expect(result.orderedContainerItems.length).toEqual(toUpdate.orderedContainerItems.length - 1);

        await expect(componentService.findOne(removedId)).rejects.toThrow(NotFoundException);
    });
});