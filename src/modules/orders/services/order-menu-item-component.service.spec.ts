import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { item_f } from "../../menu-items/utils/constants";
import { CreateOrderMenuItemComponentDto } from "../dto/order-menu-item-component/create-order-menu-item-component.dto";
import { UpdateOrderMenuItemComponentDto } from "../dto/order-menu-item-component/update-order-menu-item-component.dto";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { OrderMenuItemComponentService } from "./order-menu-item-component.service";

describe('order menu item component service', () => {
    let service: OrderMenuItemComponentService;
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let itemService: MenuItemService;

    let testId: number;
    let testIds: number[];

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        dbTestContext = new DatabaseTestContext();
        await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

        service = module.get<OrderMenuItemComponentService>(OrderMenuItemComponentService);
        itemService = module.get<MenuItemService>(MenuItemService);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should fail to create an order item component', async () => {
        const dto = {
        } as CreateOrderMenuItemComponentDto;

        const result = await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should find all order item components', async () => {
        const results = await service.findAll();

        expect(results).not.toBeNull();

        testIds = results.items.slice(0,3).map(type => type.id);
        testId = results.items[0].id;
    });

    it('should find an order item component by id', async () => {
        const result = await service.findOne(testId);
        
        expect(result).not.toBeNull();
        expect(result?.id).toEqual(testId);
    });

    it('should update item', async () => {
        const itemF = await itemService.findOneByName(item_f);
        if(!itemF){ throw new Error(); }
        if(!itemF.validSizes){ throw new Error(); }

        const dto = {
            componentMenuItemId: itemF.id,
            componentItemSizeId: itemF.validSizes[0].id,
        } as UpdateOrderMenuItemComponentDto;

        const result = await service.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result.item.id).toEqual(itemF.id);
        expect(result.itemSize.id).toEqual(itemF.validSizes[0].id);
    });

    it('should update quantity', async () => {
        const dto = {
            quantity: 50,
        } as UpdateOrderMenuItemComponentDto;

        const result = await service.update(testId, dto);
        expect(result).not.toBeNull();
        expect(result.quantity).toEqual(50);
    });

    it('should get order item components by list of ids', async () => {
        const results = await service.findEntitiesById(testIds);

        expect(results).not.toBeNull();
        expect(results.length).toEqual(testIds.length);
    });

    it('should remove order item component', async () => {
        const removal = await service.remove(testId);
        expect(removal).toBeTruthy();

        await expect(service.findOne(testId)).rejects.toThrow(NotFoundException);
    });
});