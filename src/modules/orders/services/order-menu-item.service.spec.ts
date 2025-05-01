import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { OrderMenuItemService } from "./order-menu-item.service";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { OrderService } from "./order.service";
import { item_a, item_b } from "../../menu-items/utils/constants";
import { NotFoundException } from "@nestjs/common";
import { CreateOrderMenuItemDto } from "../dto/create-order-menu-item.dto";
import { UpdateOrderMenuItemDto } from "../dto/update-order-menu-item.dto";

describe('order menu item service', () => {
    let orderItemService: OrderMenuItemService;
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext

    let orderService: OrderService;

    let menuItemService: MenuItemService;

    let testId: number;
    let testIds: number[];
    let testOrderId: number;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        dbTestContext = new DatabaseTestContext();
        await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

        orderItemService = module.get<OrderMenuItemService>(OrderMenuItemService);
        orderService = module.get<OrderService>(OrderService);

        menuItemService = module.get<MenuItemService>(MenuItemService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(orderItemService).toBeDefined();
    });

    it('should create orderMenuItem', async () => {
        const ordersRequest = await orderService.findAll();
        const testOrder = ordersRequest.items[0];
        if(!testOrder){ throw new Error(); }
        testOrderId = testOrder.id;

        const item = await menuItemService.findOneByName(item_a, ["validSizes"]);
        if(!item){ throw new NotFoundException(); }
        if(!item.validSizes){ throw new Error();}
        if(item.validSizes.length === 0){ throw new Error(); }

        const dto = {
            orderId: testOrderId,
            menuItemId: item.id,
            menuItemSizeId: item.validSizes[0].id,
            quantity: 1,
        } as CreateOrderMenuItemDto;

        const result = await orderItemService.create(dto);
        expect(result).not.toBeNull();
        expect(result?.order.id).toEqual(testOrderId);
        expect(result?.quantity).toEqual(1);
        expect(result?.menuItem.id).toEqual(item.id);
        expect(result?.size.id).toEqual(item.validSizes[0].id);

        testId = result?.id as number;
    });

    it('should update order query with new item', async () => {
        const testOrder = await orderService.findOne(testOrderId, ['items']);
        if(!testOrder){ throw new NotFoundException(); }
        if(!testOrder.items){ throw new Error(); }

        expect(testOrder.items.findIndex(item => item.id === testId)).not.toEqual(-1);
    });

    it('should find orderMenuItem by id', async () => {
        const result = await orderItemService.findOne(testId);

        expect(result).not.toBeNull();
        expect(result?.quantity).toEqual(1);
    });

    it('should update menuItem', async () => {
        const newItem = await menuItemService.findOneByName(item_b, ["validSizes"]);
        if(!newItem){ throw new NotFoundException(); }
        if(!newItem.validSizes){ throw new Error();}
        if(newItem.validSizes.length < 2){ throw new Error(); }

        const dto = {
            menuItemId: newItem.id,
            menuItemSizeId: newItem.validSizes[0].id,
        } as UpdateOrderMenuItemDto;

        const result = await orderItemService.update(testId, dto);
        if(!result){ throw new Error(); }
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
        if(!newItem){ throw new NotFoundException(); }
        if(!newItem.validSizes){ throw new Error();}
        if(newItem.validSizes.length < 2){ throw new Error(); }

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
        expect(items.length).toEqual(29)

        testIds = [items[0].id, items[1].id, items[2].id];
    });

    it('should get orderMenuItems by list of ids', async () => {
        const results = await orderItemService.findEntitiesById(testIds);
        expect(results).not.toBeNull();
        expect(results.length).toEqual(3);
    });

    it('should remove orderMenuItem', async () => {
        const removal = await orderItemService.remove(testId);
        expect(removal).toBeTruthy();

        const verify = await orderItemService.findOne(testId);
        expect(verify).toBeNull();
    });

    it('should update order query to not contain deleted item', async () => {
        const testOrder = await orderService.findOne(testOrderId, ['items']);
        if(!testOrder){ throw new NotFoundException(); }
        if(!testOrder.items){ throw new Error(); }

        expect(testOrder.items.findIndex(item => item.id === testId)).toEqual(-1);
    });
});