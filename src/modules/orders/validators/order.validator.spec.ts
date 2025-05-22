import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateOrderDto } from "../dto/order/create-order.dto";
import { UpdateOrderDto } from "../dto/order/update-order.dto";
import { OrderService } from "../services/order.service";
import { TYPE_A, TYPE_B } from "../utils/constants";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { OrderValidator } from "./order.validator";
import { OrderMenuItemService } from "../services/order-menu-item.service";
import { OrderCategoryService } from "../services/order-category.service";
import { type_a } from "../../labels/utils/constants";
import { CreateChildOrderMenuItemDto } from "../dto/order-menu-item/create-child-order-menu-item.dto";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { item_a, item_b, item_c } from "../../menu-items/utils/constants";
import { UpdateChildOrderMenuItemDto } from "../dto/order-menu-item/update-child-order-menu-item.dto";

describe('order validator', () => {
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: OrderValidator;
    let orderService: OrderService;
    let categoryService: OrderCategoryService;
    let orderItemService: OrderMenuItemService;
    let menuItemService: MenuItemService;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        validator = module.get<OrderValidator>(OrderValidator);
        orderService = module.get<OrderService>(OrderService);
        categoryService = module.get<OrderCategoryService>(OrderCategoryService);
        orderItemService = module.get<OrderMenuItemService>(OrderMenuItemService);
        menuItemService = module.get<MenuItemService>(MenuItemService);

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
        const category = await categoryService.findOneByName(type_a);
        if(!category){ throw new Error(); }

        const itemA = await menuItemService.findOneByName(item_a, ['validSizes']);
        if(!itemA){ throw new Error(); }
        const itemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!itemB){ throw new Error(); }

        const itemDtos = [
            {
                mode: 'create',
                menuItemId: itemA.id,
                menuItemSizeId: itemA.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderMenuItemDto,
            {
                mode: 'create',
                menuItemId: itemB.id,
                menuItemSizeId: itemB.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderMenuItemDto,
        ] as CreateChildOrderMenuItemDto[]
        const dto = {
            orderCategoryId: category.id,
            recipient: "CREATE",
            fulfillmentDate: new Date(),
            fulfillmentType: "pickup",
            orderedMenuItemDtos: itemDtos,
        } as CreateOrderDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create: duplicate order menu item DTOs', async () => {
        const category = await categoryService.findOneByName(type_a);
        if(!category){ throw new Error(); }

        const itemA = await menuItemService.findOneByName(item_a, ['validSizes']);
        if(!itemA){ throw new Error(); }
        const itemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!itemB){ throw new Error(); }

        const itemDtos = [
            {
                mode: 'create',
                menuItemId: itemA.id,
                menuItemSizeId: itemA.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderMenuItemDto,
            {
                mode: 'create',
                menuItemId: itemB.id,
                menuItemSizeId: itemB.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderMenuItemDto,
            {
                mode: 'create',
                menuItemId: itemA.id,
                menuItemSizeId: itemA.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderMenuItemDto,
        ] as CreateChildOrderMenuItemDto[]
        const dto = {
            orderCategoryId: category.id,
            recipient: "CREATE",
            fulfillmentDate: new Date(),
            fulfillmentType: "pickup",
            orderedMenuItemDtos: itemDtos,
        } as CreateOrderDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual('orderedMenuItemDtos contains duplicate menuItem/size combinations');
    });

    it('should pass update', async () => {
        const toUpdate = (await orderService.findAll()).items[0];

        const category = await categoryService.findOneByName(type_a);
        if(!category){ throw new Error(); }

        const itemA = await menuItemService.findOneByName(item_a, ['validSizes']);
        if(!itemA){ throw new Error(); }

        const itemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!itemB){ throw new Error(); }

        const itemC = await menuItemService.findOneByName(item_c, ['validSizes']);
        if(!itemC){ throw new Error(); }

        const itemToUpdate = (await orderItemService.findAll()).items[0];

        const itemDtos = [
            {
                mode: 'create',
                menuItemId: itemA.id,
                menuItemSizeId: itemA.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderMenuItemDto,
            {
                mode: 'create',
                menuItemId: itemB.id,
                menuItemSizeId: itemB.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderMenuItemDto,
            {
                mode: 'update',
                id: itemToUpdate.id,
                menuItemId: itemC.id,
                menuItemSizeId: itemC.validSizes[0].id,
                quantity: 1,
            } as UpdateChildOrderMenuItemDto,
        ] as (CreateChildOrderMenuItemDto | UpdateChildOrderMenuItemDto)[];

        const dto = {
            orderCategoryId: category.id,
            recipient: "CREATE",
            fulfillmentDate: new Date(),
            fulfillmentType: "pickup",
            orderedMenuItemDtos: itemDtos,
        } as UpdateOrderDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update: duplicate create order item dtos', async () => {
        const toUpdate = (await orderService.findAll()).items[0];
        
        const category = await categoryService.findOneByName(type_a);
        if(!category){ throw new Error(); }

        const itemA = await menuItemService.findOneByName(item_a, ['validSizes']);
        if(!itemA){ throw new Error(); }

        const itemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!itemB){ throw new Error(); }

        const itemC = await menuItemService.findOneByName(item_c, ['validSizes']);
        if(!itemC){ throw new Error(); }

        const itemToUpdate = (await orderItemService.findAll()).items[0];

        const itemDtos = [
            {
                mode: 'create',
                menuItemId: itemA.id,
                menuItemSizeId: itemA.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderMenuItemDto,
            {
                mode: 'create',
                menuItemId: itemB.id,
                menuItemSizeId: itemB.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderMenuItemDto,
            {
                mode: 'update',
                id: itemToUpdate.id,
                menuItemId: itemC.id,
                menuItemSizeId: itemC.validSizes[0].id,
                quantity: 1,
            } as UpdateChildOrderMenuItemDto,
            {
                mode: 'create',
                menuItemId: itemA.id,
                menuItemSizeId: itemA.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderMenuItemDto,
        ] as (CreateChildOrderMenuItemDto | UpdateChildOrderMenuItemDto)[];

        const dto = {
            orderCategoryId: category.id,
            recipient: "CREATE",
            fulfillmentDate: new Date(),
            fulfillmentType: "pickup",
            orderedMenuItemDtos: itemDtos,
        } as UpdateOrderDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`orderedMenuItemDtos contains duplicate menuItem/size combinations`);
    });

    it('should fail update: duplicate update order item dtos', async () => {
        const toUpdate = (await orderService.findAll()).items[0];
        
        const category = await categoryService.findOneByName(type_a);
        if(!category){ throw new Error(); }

        const itemA = await menuItemService.findOneByName(item_a, ['validSizes']);
        if(!itemA){ throw new Error(); }

        const itemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!itemB){ throw new Error(); }

        const itemC = await menuItemService.findOneByName(item_c, ['validSizes']);
        if(!itemC){ throw new Error(); }

        const itemToUpdate = (await orderItemService.findAll()).items[0];

        const itemDtos = [
            {
                mode: 'create',
                menuItemId: itemA.id,
                menuItemSizeId: itemA.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderMenuItemDto,
            {
                mode: 'create',
                menuItemId: itemB.id,
                menuItemSizeId: itemB.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderMenuItemDto,
            {
                mode: 'update',
                id: itemToUpdate.id,
                menuItemId: itemC.id,
                menuItemSizeId: itemC.validSizes[0].id,
                quantity: 1,
            } as UpdateChildOrderMenuItemDto,
            {
                mode: 'update',
                id: itemToUpdate.id,
                menuItemId: itemC.id,
                menuItemSizeId: itemC.validSizes[0].id,
                quantity: 1,
            } as UpdateChildOrderMenuItemDto,
        ] as (CreateChildOrderMenuItemDto | UpdateChildOrderMenuItemDto)[];

        const dto = {
            orderCategoryId: category.id,
            recipient: "CREATE",
            fulfillmentDate: new Date(),
            fulfillmentType: "pickup",
            orderedMenuItemDtos: itemDtos,
        } as UpdateOrderDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`orderedMenuItemDtos contains duplicate menuItem/size combinations`);
    });
});