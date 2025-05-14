import { NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { item_a, item_b } from "../../menu-items/utils/constants";
import { MenuItemTestingUtil } from "../../menu-items/utils/menu-item-testing.util";
import { CreateChildOrderMenuItemDto } from "../dto/create-child-order-menu-item.dto";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderMenuItemDto } from "../dto/update-order-menu-item.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";
import { TYPE_A, TYPE_B, TYPE_C, TYPE_D } from "../utils/constants";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { OrderMenuItemService } from "./order-menu-item.service";
import { OrderTypeService } from "./order-type.service";
import { OrderService } from "./order.service";

describe('order service', () => {
    let orderService: OrderService;
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let typeService: OrderTypeService;
    let orderItemService: OrderMenuItemService;

    let menuItemService: MenuItemService;
    let menuItemTestUtil: MenuItemTestingUtil;

    let testId: number;
    let testIds: number[];

    let modifiedItemId: number;
    let deletedItemId: number;

    let removedItemIds: number[];
    let removedTypeId: number;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        dbTestContext = new DatabaseTestContext();
        await testingUtil.initOrderTestDatabase(dbTestContext);

        orderService = module.get<OrderService>(OrderService);
        typeService = module.get<OrderTypeService>(OrderTypeService);
        orderItemService = module.get<OrderMenuItemService>(OrderMenuItemService);

        menuItemService = module.get<MenuItemService>(MenuItemService);
        menuItemTestUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await menuItemTestUtil.initMenuItemTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(orderService).toBeDefined();
    });

    it('should create an order (no menuItems)', async () => {
        const type = await typeService.findOneByName(TYPE_A);
        if(!type){ throw new NotFoundException(); }

        const fulfillDate = new Date();

        const dto = {
            squareOrderId: "testSQrId",
            orderTypeId: type.id,
            recipient: "test recipient",
            fulfillmentDate: fulfillDate,
            fulfillmentType: "testFufill",
            deliveryAddress: "testDelAdr",
            phoneNumber: "testPhone#",
            email: "testEmail",
            note: "testNote",
            isFrozen: false,
            isWeekly: false,
        } as CreateOrderDto;

        const result = await orderService.create(dto);

        expect(result).not.toBeNull();
        expect(result?.deliveryAddress).toEqual("testDelAdr");
        expect(result?.email).toEqual("testEmail");
        expect(result?.fulfillmentDate).toEqual(fulfillDate);
        expect(result?.fulfillmentType).toEqual("testFufill");
        expect(result?.isFrozen).toEqual(false);
        expect(result?.isWeekly).toEqual(false);
        expect(result?.note).toEqual("testNote");
        expect(result?.phoneNumber).toEqual("testPhone#");
        expect(result?.recipient).toEqual("test recipient");
        expect(result?.squareOrderId).toEqual("testSQrId");
        expect(result?.type.id).toEqual(type.id);

        testId = result?.id as number;
    });

    it('should create an order (with menuItems)', async () => {
        const type = await typeService.findOneByName(TYPE_B);
        if(!type){ throw new NotFoundException(); }

        const fulfillDate = new Date();

        const itemDtos = await testingUtil.getCreateChildOrderMenuItemDtos(3);
        const dto = {
            squareOrderId: "testSQrId2",
            orderTypeId: type.id,
            recipient: "test recipient2",
            fulfillmentDate: fulfillDate,
            fulfillmentType: "testFufill2",
            deliveryAddress: "testDelAdr2",
            phoneNumber: "testPhone#2",
            email: "testEmail2",
            note: "testNote2",
            isFrozen: false,
            isWeekly: false,
            orderMenuItemDtos: itemDtos,
        } as CreateOrderDto;

        const result = await orderService.create(dto);

        expect(result).not.toBeNull();
        expect(result?.deliveryAddress).toEqual("testDelAdr2");
        expect(result?.email).toEqual("testEmail2");
        expect(result?.fulfillmentDate).toEqual(fulfillDate);
        expect(result?.fulfillmentType).toEqual("testFufill2");
        expect(result?.isFrozen).toEqual(false);
        expect(result?.isWeekly).toEqual(false);
        expect(result?.note).toEqual("testNote2");
        expect(result?.phoneNumber).toEqual("testPhone#2");
        expect(result?.recipient).toEqual("test recipient2");
        expect(result?.squareOrderId).toEqual("testSQrId2");
        expect(result?.type.id).toEqual(type.id);
        expect(result?.items?.length).toEqual(3);
    });

    it('should find an order by id', async () => {
        const result = await orderService.findOne(testId);

        expect(result).not.toBeNull();
    });

    it('should update squareOrderId', async () => {
        const dto = {
            squareOrderId: "UPDATE sqrOrdrId",
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.squareOrderId).toEqual("UPDATE sqrOrdrId")
    });

    it('should update', async () => {
        const newType = await typeService.findOneByName(TYPE_C);
        if(!newType){ throw new NotFoundException(); }

        const dto = {
            orderTypeId: newType.id,
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.type.id).toEqual(newType.id);
    });

    // Order Type *****
    it('should gain reference by orderType', async () => {
        const orderType = await typeService.findOneByName(TYPE_C, ['orders']);
        if(!orderType){ throw new NotFoundException(); }

        expect(orderType.orders?.findIndex(order => order.id === testId)).not.toEqual(-1);
    });

    // Order Type
    it('should update order type again', async () => {
        const newType = await typeService.findOneByName(TYPE_D);
        if(!newType){ throw new NotFoundException(); }

        const dto = {
            orderTypeId: newType.id,
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.type.id).toEqual(newType.id);
    });

    it('should lose reference from previous orderType', async () => {
        const orderType = await typeService.findOneByName(TYPE_C, ['orders']);
        if(!orderType){ throw new NotFoundException(); }

        expect(orderType.orders?.findIndex(order => order.id === testId)).toEqual(-1);
    });

    it('should gain reference by new orderType', async () => {
        const orderType = await typeService.findOneByName(TYPE_D, ['orders']);
        if(!orderType){ throw new NotFoundException(); }

        expect(orderType.orders?.findIndex(order => order.id === testId)).not.toEqual(-1);
    });

    it('should update recipient', async () => {
        const dto = {
            recipient: "UPDATED recipient"
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.recipient).toEqual("UPDATED recipient");
    });

    it('should update fulfillment date', async () => {
        const newDate = new Date();

        const dto = {
            fulfillmentDate: newDate,
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.fulfillmentDate).toEqual(newDate);
    });

    it('should update fulfillment type', async () => {
        const dto = {
            fulfillmentType: "UPDATED FULFILL TYPE"
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.fulfillmentType).toEqual("UPDATED FULFILL TYPE");
    });

    it('should update delivery address', async () => {
        const dto = {
            deliveryAddress: "UPDATE DEL ADDR"
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.deliveryAddress).toEqual("UPDATE DEL ADDR");
    });

    it('should update phone number', async () => {
        const dto = {
            phoneNumber: "UPDATE PHONE #"
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.phoneNumber).toEqual("UPDATE PHONE #");
    });

    it('should update email', async () => {
        const dto = {
            email: "UPDATE EMAIL"
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.email).toEqual("UPDATE EMAIL");
    });

    it('should update note', async () => {
        const dto = {
            note: "UPDATE NOTE"
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.note).toEqual("UPDATE NOTE");
    });

    it('should update isFrozen', async () => {
        const dto = {
            isFrozen: true,
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.isFrozen).toBeTruthy();
    });

    it('should update isWeekly', async () => {
        const dto = {
            isWeekly: true,
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.isWeekly).toBeTruthy();
    });

    it('should add items', async () => {
        const order = await orderService.findOne(testId);
        if(!order){ throw new NotFoundException(); }

        const itemA = await menuItemService.findOneByName(item_a, ['validSizes']);
        if(!itemA){ throw new NotFoundException(); }
        if(!itemA.validSizes){ throw new Error();}
        if(itemA.validSizes.length === 0){ throw new Error();}

        const itemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!itemB){ throw new NotFoundException(); }
        if(!itemB.validSizes){ throw new Error();}
        if(itemB.validSizes.length === 0){ throw new Error();}

        const cDtos = [{
            mode: 'create',
            menuItemId: itemA.id,
            menuItemSizeId: itemA.validSizes[0].id,
            quantity: 10,
        }, {
            mode: 'create',
            menuItemId: itemB.id,
            menuItemSizeId: itemB.validSizes[0].id,
            quantity: 10,
        }] as CreateChildOrderMenuItemDto[];

        const orderDto = {
            orderMenuItemDtos: cDtos
        } as UpdateOrderDto;

        const result = await orderService.update(testId, orderDto);
        expect(result).not.toBeNull();
        expect(result?.items?.length).toEqual(2);
    });

    it('should modify items', async () => {
        const order = await orderService.findOne(testId, ['items']);
        if(!order){ throw new NotFoundException(); }
        if(!order.items){ throw new NotFoundException(); }

        modifiedItemId = order.items[0].id;

        const uDto = {
            mode: 'update',
            id: modifiedItemId,
            quantity: 100,
        } as UpdateOrderMenuItemDto;

        const theRest = order.items.slice(1).map(item => ({
            mode: 'update',
            id: item.id,
        }) as UpdateOrderMenuItemDto);

        const orderDto = {
            orderMenuItemDtos: [ uDto, ...theRest],
        } as UpdateOrderDto;

        const result = await orderService.update(testId, orderDto);
        if(!result){ throw new Error(); }
        if(!result.items){ throw new Error(); }

        expect(result).not.toBeNull();
        for(const item of result?.items){
            if(item.id === modifiedItemId){
                expect(item.quantity).toEqual(100);
            }
        }
    });

    it('should update orderMenuItem when queried by orderMenuItemService', async () => {
        const item = await orderItemService.findOne(modifiedItemId);
        expect(item).not.toBeNull();
        expect(item?.quantity).toEqual(100);
    })

    it('should remove items', async () => {
        const order = await orderService.findOne(testId, ['items']);
        if(!order){ throw new NotFoundException(); }
        if(!order.items){ throw new NotFoundException(); }

        deletedItemId = order.items[0].id;

        const theRest = order.items.slice(1).map(item => ({
            mode: 'update',
            id: item.id,
        }) as UpdateOrderMenuItemDto);

        const orderDto = {
            orderMenuItemDtos: theRest,
        } as UpdateOrderDto;

        const result = await orderService.update(testId, orderDto);
        if(!result){ throw new Error(); }
        if(!result.items){ throw new Error(); }

        expect(result).not.toBeNull();
        expect(result.items.length).toEqual(1);
        expect(result.items.findIndex(item => item.id === deletedItemId)).toEqual(-1);
    });

    it('should truly remove deleted orderMenuItem', async () => {
        const item = await orderItemService.findOne(deletedItemId);
        expect(item).toBeNull();
    })

    it('should find all orders', async () => {
        const results = await orderService.findAll();

        expect(results).not.toBeNull();
        expect(results.items.length).toEqual(9);

        testIds = results.items.slice(0,3).map(o => o.id);
    });

    it('should find orders by list of ids', async () => {
        const results = await orderService.findEntitiesById(testIds);

        expect(results).not.toBeNull();
        expect(results.length).toEqual(3);
    });

    it('should remove order', async () => {
        const toRemove = await orderService.findOne(testId, ['items', 'type']);
        if(!toRemove){ throw new NotFoundException(); }
        if(!toRemove.items){ throw new Error(); }
        
        removedItemIds = toRemove.items.map(i => i.id);
        removedTypeId = toRemove.type.id;

        const removal = await orderService.remove(testId);
        expect(removal).toBeTruthy();

        const verify = await orderService.findOne(testId);
        expect(verify).toBeNull();
    });

    it('should remove orderMenuItems', async () => {
        const results = await orderItemService.findEntitiesById(removedItemIds);
        expect(results.length).toEqual(0);
    });

    it('should lose OrderType reference', async () => {
        const type = await typeService.findOne(removedTypeId, ['orders']);
        if(!type){ throw new NotFoundException(); }

        expect(type.orders?.findIndex(o => o.id === testId)).toEqual(-1);
    });
});