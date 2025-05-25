import { NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { MenuItemContainerOptionsService } from "../../menu-items/services/menu-item-container-options.service";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { item_a, item_b } from "../../menu-items/utils/constants";
import { MenuItemTestingUtil } from "../../menu-items/utils/menu-item-testing.util";
import { CreateChildOrderContainerItemDto } from "../dto/order-container-item/create-child-order-container-item.dto";
import { UpdateChildOrderContainerItemDto } from "../dto/order-container-item/update-child-order-container-item.dto";
import { CreateChildOrderMenuItemDto } from "../dto/order-menu-item/create-child-order-menu-item.dto";
import { UpdateChildOrderMenuItemDto } from "../dto/order-menu-item/update-child-order-menu-item.dto";
import { UpdateOrderMenuItemDto } from "../dto/order-menu-item/update-order-menu-item.dto";
import { CreateOrderDto } from "../dto/order/create-order.dto";
import { UpdateOrderDto } from "../dto/order/update-order.dto";
import { TYPE_A, TYPE_B, TYPE_C, TYPE_D } from "../utils/constants";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { OrderCategoryService } from "./order-category.service";
import { OrderMenuItemService } from "./order-menu-item.service";
import { OrderService } from "./order.service";

describe('order service', () => {
    let orderService: OrderService;
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let typeService: OrderCategoryService;
    let orderItemService: OrderMenuItemService;

    let menuItemService: MenuItemService;
    let optionService: MenuItemContainerOptionsService;
    let menuItemTestUtil: MenuItemTestingUtil;

    let testId: number;
    let testIds: number[];

    let modifiedItemId: number;
    let deletedItemId: number;

    let removedItemIds: number[];
    let removedTypeId: number;

    let testOrderCompItemId: number;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();

        dbTestContext = new DatabaseTestContext();

        menuItemTestUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await menuItemTestUtil.initMenuItemContainerTestDatabase(dbTestContext);

        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        await testingUtil.initOrderTestDatabase(dbTestContext);

        orderService = module.get<OrderService>(OrderService);
        typeService = module.get<OrderCategoryService>(OrderCategoryService);
        orderItemService = module.get<OrderMenuItemService>(OrderMenuItemService);

        menuItemService = module.get<MenuItemService>(MenuItemService);
        optionService = module.get<MenuItemContainerOptionsService>(MenuItemContainerOptionsService);

    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(orderService).toBeDefined();
    });

    it('should create an order (with menuItems)', async () => {
        const type = await typeService.findOneByName(TYPE_B);
        if (!type) { throw new NotFoundException(); }

        const fulfillDate = new Date();

        const itemDtos = await testingUtil.getCreateChildOrderMenuItemDtos(3);
        const dto = {
            orderCategoryId: type.id,
            recipient: "test recipient",
            fulfillmentDate: fulfillDate,
            fulfillmentType: "delivery",
            deliveryAddress: "testDelAdr",
            phoneNumber: "testPhone#",
            email: "testEmail",
            note: "testNote",
            isFrozen: false,
            isWeekly: false,
            weeklyFulfillment: "sunday",
            orderedMenuItemDtos: itemDtos,
        } as CreateOrderDto;

        try {
            const result = await orderService.create(dto);
            expect(result).not.toBeNull();
            expect(result?.deliveryAddress).toEqual("testDelAdr");
            expect(result?.email).toEqual("testEmail");
            expect(result?.fulfillmentDate).toEqual(fulfillDate);
            expect(result?.fulfillmentType).toEqual("delivery");
            expect(result?.isFrozen).toEqual(false);
            expect(result?.isWeekly).toEqual(false);
            expect(result?.weeklyFulfillment).toEqual("sunday");
            expect(result?.note).toEqual("testNote");
            expect(result?.phoneNumber).toEqual("testPhone#");
            expect(result?.recipient).toEqual("test recipient");
            expect(result?.orderCategory.id).toEqual(type.id);
            expect(result?.orderedItems?.length).toEqual(3);

            testId = result?.id as number;
        } catch (err) {
            expect(err).toBeUndefined();
        }
    });

    it('should find an order by id', async () => {
        const result = await orderService.findOne(testId);

        expect(result).not.toBeNull();
    });

    it('should update order type', async () => {
        const newType = await typeService.findOneByName(TYPE_C);
        if (!newType) { throw new NotFoundException(); }

        const dto = {
            orderCategoryId: newType.id,
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.orderCategory.id).toEqual(newType.id);
    });

    // Order Type *****
    it('should gain reference by orderType', async () => {
        const orderType = await typeService.findOneByName(TYPE_C, ['orders']);
        if (!orderType) { throw new NotFoundException(); }

        expect(orderType.orders?.findIndex(order => order.id === testId)).not.toEqual(-1);
    });

    // Order Type
    it('should update order type again', async () => {
        const newType = await typeService.findOneByName(TYPE_D);
        if (!newType) { throw new NotFoundException(); }

        const dto = {
            orderCategoryId: newType.id,
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.orderCategory.id).toEqual(newType.id);
    });

    it('should lose reference from previous orderType', async () => {
        const orderType = await typeService.findOneByName(TYPE_C, ['orders']);
        if (!orderType) { throw new NotFoundException(); }

        expect(orderType.orders?.findIndex(order => order.id === testId)).toEqual(-1);
    });

    it('should gain reference by new orderType', async () => {
        const orderType = await typeService.findOneByName(TYPE_D, ['orders']);
        if (!orderType) { throw new NotFoundException(); }

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

    it('should update fulfillmentContact', async () => {
        const dto = {
            fulfillmentContactName: "UPDATED fulfillmentContact"
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.fulfillmentContactName).toEqual("UPDATED fulfillmentContact");
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
            fulfillmentType: "delivery"
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.fulfillmentType).toEqual("delivery");
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

    it('should update weeklyFulfillment', async () => {
        const dto = {
            weeklyFulfillment: "monday",
        } as UpdateOrderDto;

        const result = await orderService.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result?.weeklyFulfillment).toEqual("monday");
    });

    it('should add items', async () => {
        const order = await orderService.findOne(testId);
        if (!order) { throw new NotFoundException(); }

        const itemA = await menuItemService.findOneByName(item_a, ['validSizes']);
        if (!itemA) { throw new NotFoundException(); }
        if (!itemA.validSizes) { throw new Error(); }
        if (itemA.validSizes.length === 0) { throw new Error(); }

        const itemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if (!itemB) { throw new NotFoundException(); }
        if (!itemB.validSizes) { throw new Error(); }
        if (itemB.validSizes.length === 0) { throw new Error(); }

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
            orderedMenuItemDtos: cDtos
        } as UpdateOrderDto;

        const result = await orderService.update(testId, orderDto);
        expect(result).not.toBeNull();
        expect(result?.orderedItems?.length).toEqual(2);
    });

    it('should modify items', async () => {
        const order = await orderService.findOne(testId, ['orderedItems']);
        if (!order) { throw new NotFoundException(); }
        if (!order.orderedItems) { throw new NotFoundException(); }

        modifiedItemId = order.orderedItems[0].id;

        const uDto = {
            mode: 'update',
            id: modifiedItemId,
            quantity: 100,
        } as UpdateOrderMenuItemDto;

        const theRest = order.orderedItems.slice(1).map(item => ({
            mode: 'update',
            id: item.id,
        }) as UpdateOrderMenuItemDto);

        const orderDto = {
            orderedMenuItemDtos: [uDto, ...theRest],
        } as UpdateOrderDto;

        const result = await orderService.update(testId, orderDto);
        if (!result) { throw new Error(); }
        if (!result.orderedItems) { throw new Error(); }

        expect(result).not.toBeNull();
        for (const item of result?.orderedItems) {
            if (item.id === modifiedItemId) {
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
        const order = await orderService.findOne(testId, ['orderedItems']);
        if (!order) { throw new NotFoundException(); }
        if (!order.orderedItems) { throw new NotFoundException(); }

        deletedItemId = order.orderedItems[0].id;

        const theRest = order.orderedItems.slice(1).map(item => ({
            mode: 'update',
            id: item.id,
        }) as UpdateOrderMenuItemDto);

        const orderDto = {
            orderedMenuItemDtos: theRest,
        } as UpdateOrderDto;

        const result = await orderService.update(testId, orderDto);
        if (!result) { throw new Error(); }
        if (!result.orderedItems) { throw new Error(); }

        expect(result).not.toBeNull();
        expect(result.orderedItems.length).toEqual(1);
        expect(result.orderedItems.findIndex(item => item.id === deletedItemId)).toEqual(-1);
    });

    it('should truly remove deleted orderMenuItem', async () => {
        await expect(orderItemService.findOne(deletedItemId)).rejects.toThrow(NotFoundException);
    })

    it('should find all orders', async () => {
        const results = await orderService.findAll();

        expect(results).not.toBeNull();
        expect(results.items.length).toEqual(8);

        testIds = results.items.slice(0, 3).map(o => o.id);
    });

    it('should find orders by list of ids', async () => {
        const results = await orderService.findEntitiesById(testIds);

        expect(results).not.toBeNull();
        expect(results.length).toEqual(3);
    });

    it('should remove order', async () => {
        const toRemove = await orderService.findOne(testId, ['orderedItems', 'orderCategory']);
        if (!toRemove) { throw new NotFoundException(); }
        if (!toRemove.orderedItems) { throw new Error(); }

        removedItemIds = toRemove.orderedItems.map(i => i.id);
        removedTypeId = toRemove.orderCategory.id;

        const removal = await orderService.remove(testId);
        expect(removal).toBeTruthy();

        await expect(orderService.findOne(testId)).rejects.toThrow(NotFoundException);
    });

    it('should remove orderMenuItems', async () => {
        const results = await orderItemService.findEntitiesById(removedItemIds);
        expect(results.length).toEqual(0);
    });

    it('should lose OrderType reference', async () => {
        const type = await typeService.findOne(removedTypeId, ['orders']);
        if (!type) { throw new NotFoundException(); }

        expect(type.orders?.findIndex(o => o.id === testId)).toEqual(-1);
    });

    it('should create an order with order menu item with components', async () => {
        const items = (await menuItemService.findAll({ relations: ['containerOptions', 'validSizes'], limit: 50 })).items;

        const optionItems = items.filter(item => item.containerOptions);

        if (!optionItems[0].containerOptions) { throw new Error(); }
        const optionItemA = await optionService.findOne(optionItems[0].containerOptions.id, ['parentContainer']);

        if (!optionItems[1].containerOptions) { throw new Error(); }
        const optionItemB = await optionService.findOne(optionItems[1].containerOptions.id, ['parentContainer']);

        const compDtos_a = [
            {
                mode: 'create',
                parentContainerMenuItemId: optionItemA.parentContainer.id,
                containedMenuItemId: optionItemA.containerRules[0].validItem.id,
                containedMenuItemSizeId: optionItemA.containerRules[0].validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderContainerItemDto,
        ] as CreateChildOrderContainerItemDto[]

        const compDtos_b = [
            {
                mode: 'create',
                parentContainerMenuItemId: optionItemB.parentContainer.id,
                containedMenuItemId: optionItemB.containerRules[0].validItem.id,
                containedMenuItemSizeId: optionItemB.containerRules[0].validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderContainerItemDto,
        ] as CreateChildOrderContainerItemDto[]

        const oItemDtos = [
            {
                mode: 'create',
                menuItemId: optionItemA.parentContainer.id,
                menuItemSizeId: optionItems[0].validSizes[0].id,
                quantity: 1,
                orderedItemContainerDtos: compDtos_a,
            } as CreateChildOrderMenuItemDto,
            {
                mode: 'create',
                menuItemId: optionItemB.parentContainer.id,
                menuItemSizeId: optionItems[1].validSizes[0].id,
                quantity: 1,
                orderedItemContainerDtos: compDtos_b,
            } as CreateChildOrderMenuItemDto,
        ] as CreateChildOrderMenuItemDto[];

        const oType = await typeService.findOneByName(TYPE_A);
        if (!oType) { throw new Error(); }
        const orderDto = {
            orderCategoryId: oType.id,
            recipient: "order / orderItemComp test",
            fulfillmentDate: new Date(),
            fulfillmentType: "pickup",
            orderedMenuItemDtos: oItemDtos,
        } as CreateOrderDto;

        const result = await orderService.create(orderDto);
        if (!result) { throw new Error(); }
        if (!result.orderedItems) { throw new Error(); }
        if (!result.orderedItems[0].orderedContainerItems) { throw new Error(); }
        if (!result.orderedItems[1].orderedContainerItems) { throw new Error(); }
        expect(result.orderedItems[0].orderedContainerItems.length).toEqual(1);
        expect(result.orderedItems[1].orderedContainerItems.length).toEqual(1);

        testOrderCompItemId = result.id;
    });

    it('should modify order menu item container (add)', async () => {
        const order = await orderService.findOne(testOrderCompItemId, ['orderedItems'], ['orderedItems.orderedContainerItems']);
        if (!order) { throw new Error(); }
        if (!order.orderedItems) { throw new Error(); }

        const containerItems = order.orderedItems.filter(item => item.orderedContainerItems.length > 0);

        const itemToUpdate = await orderItemService.findOne(containerItems[0].id, ['menuItem']);
        if (!itemToUpdate) { throw new Error(); }

        const parentMenuItem = await menuItemService.findOne(itemToUpdate.menuItem.id, ['validSizes', 'containerOptions']);
        if (!parentMenuItem) { throw new Error(); }
        if (!parentMenuItem.containerOptions) { throw new Error(); }

        const options = await optionService.findOne(parentMenuItem.containerOptions.id);

        const createCompDto = {
            mode: 'create',
            parentContainerMenuItemId: parentMenuItem.id,
            containedMenuItemId: options.containerRules[1].validItem.id,
            containedMenuItemSizeId: options.containerRules[1].validSizes[0].id,
            quantity: 1,
        } as CreateChildOrderContainerItemDto;

        if (!order.orderedItems[0].orderedContainerItems) { throw new Error(); }
        const updateComponentDtos = order.orderedItems[0].orderedContainerItems.map(comp => ({
            mode: 'update',
            id: comp.id
        }) as UpdateChildOrderContainerItemDto);

        const updateOrderItemDto = {
            mode: 'update',
            id: order.orderedItems[0].id,
            orderedItemContainerDtos: [createCompDto, ...updateComponentDtos]
        } as UpdateChildOrderMenuItemDto;

        const updatedItemId = order.orderedItems[0].id;
        const originalCompSize = order.orderedItems[0].orderedContainerItems.length;

        const theRest = order.orderedItems.slice(1).map(item => ({
            mode: 'update',
            id: item.id
        }) as UpdateChildOrderMenuItemDto);

        const uOrderDto = {
            orderedMenuItemDtos: [updateOrderItemDto, ...theRest]
        } as UpdateOrderDto;

        const result = await orderService.update(testOrderCompItemId, uOrderDto);
        if (!result) { throw new Error(); }
        if (!result.orderedItems) { throw new Error(); }
        for (const item of result.orderedItems) {
            if (item.id === updatedItemId) {
                expect(item.orderedContainerItems?.length).toEqual(originalCompSize + 1);
            }
        }
    });

    it('should modify order menu item components (modify)', async () => {
        const order = await orderService.findOne(testOrderCompItemId, ['orderedItems'], ['orderedItems.orderedContainerItems']);
        if (!order) { throw new Error(); }
        if (!order.orderedItems) { throw new Error(); }
        if (!order.orderedItems[0].orderedContainerItems) { throw new Error(); }

        const containerItems = order.orderedItems.filter(item => item.orderedContainerItems.length > 0);

        const itemToUpdate = await orderItemService.findOne(containerItems[1].id, ['menuItem']);
        if (!itemToUpdate) { throw new Error(); }

        const parentMenuItem = await menuItemService.findOne(itemToUpdate.menuItem.id, ['validSizes', 'containerOptions']);
        if (!parentMenuItem) { throw new Error(); }
        if (!parentMenuItem.containerOptions) { throw new Error(); }

        const options = await optionService.findOne(parentMenuItem.containerOptions.id);

        const updateComponentDto = {
            mode: 'update',
            id: order.orderedItems[0].orderedContainerItems[0].id,
            parentContainerMenuItemId: parentMenuItem.id,
            containedMenuItemId: options.containerRules[1].validItem.id,
            containedMenuItemSizeId: options.containerRules[1].validSizes[0].id,
            quantity: 2,
        } as UpdateChildOrderContainerItemDto;

        const moddedCompId = order.orderedItems[1].orderedContainerItems[0].id;
        const moddedItemId = order.orderedItems[1].id;


        const updateItemDto = {
            mode: 'update',
            id: order.orderedItems[1].id,
            orderedItemContainerDtos: [updateComponentDto]
        } as UpdateChildOrderMenuItemDto;

        const theRestItems = {
            mode: 'update',
            id: order.orderedItems[0].id,
        } as UpdateChildOrderMenuItemDto;

        const updateOrderDto = {
            orderedMenuItemDtos: [updateItemDto, theRestItems]
        } as UpdateOrderDto;

        const result = await orderService.update(testOrderCompItemId, updateOrderDto);
        if (!result) { throw new Error(); }
        if (!result.orderedItems) { throw new Error(); }
        for (const item of result.orderedItems) {
            if (item.id === moddedItemId) {
                if (!item.orderedContainerItems) { throw new Error(); }
                for (const comp of item.orderedContainerItems) {
                    if (comp.id === moddedCompId) {
                        expect(comp.containedItem.id).toEqual(options.containerRules[1].validItem.id);
                        expect(comp.containedItemSize.id).toEqual(options.containerRules[1].validSizes[0].id);
                        expect(comp.quantity).toEqual(2);
                    }
                }
            }
        }
    });

    it('should modify order menu item components (remove)', async () => {
        const order = await orderService.findOne(testOrderCompItemId, ['orderedItems'], ['orderedItems.orderedContainerItems']);
        if (!order) { throw new Error(); }
        if (!order.orderedItems) { throw new Error(); }
        if (!order.orderedItems[0].orderedContainerItems) { throw new Error(); }

        const theRestComponents = order.orderedItems[0].orderedContainerItems.slice(1).map(comp => ({
            mode: 'update',
            id: comp.id,
        }) as UpdateChildOrderContainerItemDto)

        //const removedComp = order.orderedItems[0].orderedContainerItems[0].id;

        const updateItemDto = {
            mode: 'update',
            id: order.orderedItems[0].id,
            orderedItemContainerDtos: theRestComponents,
        } as UpdateChildOrderMenuItemDto;

        const theRestItems = order.orderedItems.slice(1).map(item => ({
            mode: 'update',
            id: item.id,
        }) as UpdateChildOrderMenuItemDto)

        const updateOrderDto = {
            orderedMenuItemDtos: [updateItemDto, ...theRestItems]
        } as UpdateOrderDto;

        const result = await orderService.update(testOrderCompItemId, updateOrderDto);
        if (!result) { throw new Error(); }
        if (!result.orderedItems) { throw new Error(); }
        expect(result.orderedItems[0].orderedContainerItems?.length).toEqual(order.orderedItems[0].orderedContainerItems.length - 1);
    });
});