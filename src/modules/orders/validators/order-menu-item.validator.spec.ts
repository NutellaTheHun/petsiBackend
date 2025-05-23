import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { MenuItemSizeService } from "../../menu-items/services/menu-item-size.service";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { item_a, item_b, item_c } from "../../menu-items/utils/constants";
import { CreateChildOrderContainerItemDto } from "../dto/order-container-item/create-child-order-container-item.dto";
import { UpdateChildOrderContainerItemDto } from "../dto/order-container-item/update-child-order-container-item.dto";
import { CreateChildOrderMenuItemDto } from "../dto/order-menu-item/create-child-order-menu-item.dto";
import { UpdateChildOrderMenuItemDto } from "../dto/order-menu-item/update-child-order-menu-item.dto";
import { OrderContainerItemService } from "../services/order-container-item.service";
import { OrderMenuItemService } from "../services/order-menu-item.service";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { OrderMenuItemValidator } from "./order-menu-item.validator";

describe('order category validator', () => {
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: OrderMenuItemValidator;
    let orderItemservice: OrderMenuItemService;
    let orderContainerservice: OrderContainerItemService;
    let menuItemService: MenuItemService;
    let sizeService: MenuItemSizeService;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        validator = module.get<OrderMenuItemValidator>(OrderMenuItemValidator);

        orderItemservice = module.get<OrderMenuItemService>(OrderMenuItemService);
        orderContainerservice = module.get<OrderContainerItemService>(OrderContainerItemService);
        menuItemService = module.get<MenuItemService>(MenuItemService);
        sizeService = module.get<MenuItemSizeService>(MenuItemSizeService);

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
        const item = await menuItemService.findOneByName(item_a, ['validSizes']);
        if (!item) { throw new Error(); }

        const contItemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if (!contItemB) { throw new Error(); }
        const contItemC = await menuItemService.findOneByName(item_c, ['validSizes']);
        if (!contItemC) { throw new Error(); }

        const containerDtos = [
            {
                mode: 'create',
                parentContainerMenuItemId: item.id,
                containedMenuItemId: contItemB.id,
                containedMenuItemSizeId: contItemB.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderContainerItemDto,
            {
                mode: 'create',
                parentContainerMenuItemId: item.id,
                containedMenuItemId: contItemC.id,
                containedMenuItemSizeId: contItemC.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderContainerItemDto,
        ] as CreateChildOrderContainerItemDto[];

        const dto = {
            mode: 'create',
            menuItemId: item.id,
            menuItemSizeId: item.validSizes[0].id,
            quantity: 1,
            orderedItemContainerDtos: containerDtos,
        } as CreateChildOrderMenuItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create: invalid dto size for dto item', async () => {
        const itemA = await menuItemService.findOneByName(item_a, ['validSizes']);
        if (!itemA) { throw new Error(); }

        const sizes = (await sizeService.findAll()).items;

        const badSizes = sizes.filter(size => !itemA.validSizes.find(validSize => validSize.id === size.id));
        const dto = {
            mode: 'create',
            menuItemId: itemA.id,
            menuItemSizeId: badSizes[0].id,
            quantity: 1,
        } as CreateChildOrderMenuItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`size on dto ${badSizes[0].name} with id ${badSizes[0].id} is not a valid size for dto menu item ${itemA.itemName} with id ${itemA.id}`);
    });

    it('should fail create: duplicate containerItem dtos', async () => {
        const item = await menuItemService.findOneByName(item_a, ['validSizes']);
        if (!item) { throw new Error(); }

        const contItemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if (!contItemB) { throw new Error(); }
        const contItemC = await menuItemService.findOneByName(item_c, ['validSizes']);
        if (!contItemC) { throw new Error(); }

        const containerDtos = [
            {
                mode: 'create',
                parentContainerMenuItemId: item.id,
                containedMenuItemId: contItemB.id,
                containedMenuItemSizeId: contItemB.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderContainerItemDto,
            {
                mode: 'create',
                parentContainerMenuItemId: item.id,
                containedMenuItemId: contItemC.id,
                containedMenuItemSizeId: contItemC.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderContainerItemDto,
            {
                mode: 'create',
                parentContainerMenuItemId: item.id,
                containedMenuItemId: contItemB.id,
                containedMenuItemSizeId: contItemB.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderContainerItemDto,
        ] as CreateChildOrderContainerItemDto[];

        const dto = {
            mode: 'create',
            menuItemId: item.id,
            menuItemSizeId: item.validSizes[0].id,
            quantity: 1,
            orderedItemContainerDtos: containerDtos,
        } as CreateChildOrderMenuItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`order item container dtos contains duplicate item/item size`);
    });

    it('should pass update', async () => {
        const containerItems = (await orderContainerservice.findAll({ relations: ['parentOrderItem'] })).items;

        const parentOrderItem = await orderItemservice.findOne(containerItems[0].parentOrderItem.id, ['order', 'menuItem', 'size']);
        if (!parentOrderItem) { throw new Error(); }
        if (!parentOrderItem.menuItem) { throw new Error(); }

        const parentMenuItem = await menuItemService.findOne(parentOrderItem.menuItem.id, ['validSizes']);
        if (!parentMenuItem) { throw new Error(); }

        const contItemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if (!contItemB) { throw new Error(); }
        const contItemC = await menuItemService.findOneByName(item_c, ['validSizes']);
        if (!contItemC) { throw new Error(); }

        const containerDtos = [
            {
                mode: 'create',
                parentContainerMenuItemId: parentMenuItem.id,
                containedMenuItemId: contItemB.id,
                containedMenuItemSizeId: contItemB.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderContainerItemDto,
            {
                mode: 'update',
                id: containerItems[0].id,
                parentContainerMenuItemId: parentMenuItem.id,
                containedMenuItemId: contItemC.id,
                containedMenuItemSizeId: contItemC.validSizes[0].id,
                quantity: 1,
            } as UpdateChildOrderContainerItemDto,
        ] as CreateChildOrderContainerItemDto[];

        const dto = {
            mode: 'update',
            id: parentOrderItem.id,
            menuItemId: parentMenuItem.id,
            menuItemSizeId: parentMenuItem.validSizes[0].id,
            quantity: 1,
            orderedItemContainerDtos: containerDtos,
        } as UpdateChildOrderMenuItemDto;

        const result = await validator.validateUpdate(parentOrderItem.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update: duplicate create dtos', async () => {
        const containerItems = (await orderContainerservice.findAll({ relations: ['parentOrderItem'] })).items;

        const parentOrderItem = await orderItemservice.findOne(containerItems[0].parentOrderItem.id, ['order', 'menuItem', 'size']);
        if (!parentOrderItem) { throw new Error(); }
        if (!parentOrderItem.menuItem) { throw new Error(); }

        const parentMenuItem = await menuItemService.findOne(parentOrderItem.menuItem.id, ['validSizes']);
        if (!parentMenuItem) { throw new Error(); }

        const contItemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if (!contItemB) { throw new Error(); }
        const contItemC = await menuItemService.findOneByName(item_c, ['validSizes']);
        if (!contItemC) { throw new Error(); }

        const containerDtos = [
            {
                mode: 'create',
                parentContainerMenuItemId: parentMenuItem.id,
                containedMenuItemId: contItemB.id,
                containedMenuItemSizeId: contItemB.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderContainerItemDto,
            {
                mode: 'update',
                id: containerItems[0].id,
                parentContainerMenuItemId: parentMenuItem.id,
                containedMenuItemId: contItemC.id,
                containedMenuItemSizeId: contItemC.validSizes[0].id,
                quantity: 1,
            } as UpdateChildOrderContainerItemDto,
            {
                mode: 'create',
                parentContainerMenuItemId: parentMenuItem.id,
                containedMenuItemId: contItemB.id,
                containedMenuItemSizeId: contItemB.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderContainerItemDto,
        ] as CreateChildOrderContainerItemDto[];

        const dto = {
            mode: 'update',
            id: parentOrderItem.id,
            menuItemId: parentMenuItem.id,
            menuItemSizeId: parentMenuItem.validSizes[0].id,
            quantity: 1,
            orderedItemContainerDtos: containerDtos,
        } as UpdateChildOrderMenuItemDto;

        const result = await validator.validateUpdate(parentOrderItem.id, dto);
        expect(result).toEqual(`order item container dtos contains duplicate item/item size`);
    });

    it('should fail update: duplicate update dtos', async () => {
        const containerItems = (await orderContainerservice.findAll({ relations: ['parentOrderItem'] })).items;

        const parentOrderItem = await orderItemservice.findOne(containerItems[0].parentOrderItem.id, ['order', 'menuItem', 'size']);
        if (!parentOrderItem) { throw new Error(); }
        if (!parentOrderItem.menuItem) { throw new Error(); }

        const parentMenuItem = await menuItemService.findOne(parentOrderItem.menuItem.id, ['validSizes']);
        if (!parentMenuItem) { throw new Error(); }

        const contItemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if (!contItemB) { throw new Error(); }
        const contItemC = await menuItemService.findOneByName(item_c, ['validSizes']);
        if (!contItemC) { throw new Error(); }

        const containerDtos = [
            {
                mode: 'create',
                parentContainerMenuItemId: parentMenuItem.id,
                containedMenuItemId: contItemB.id,
                containedMenuItemSizeId: contItemB.validSizes[0].id,
                quantity: 1,
            } as CreateChildOrderContainerItemDto,
            {
                mode: 'update',
                id: containerItems[0].id,
                parentContainerMenuItemId: parentMenuItem.id,
                containedMenuItemId: contItemC.id,
                containedMenuItemSizeId: contItemC.validSizes[0].id,
                quantity: 1,
            } as UpdateChildOrderContainerItemDto,
            {
                mode: 'update',
                id: containerItems[0].id,
                parentContainerMenuItemId: parentMenuItem.id,
                containedMenuItemId: contItemC.id,
                containedMenuItemSizeId: contItemC.validSizes[0].id,
                quantity: 1,
            } as UpdateChildOrderContainerItemDto,
        ] as CreateChildOrderContainerItemDto[];

        const dto = {
            mode: 'update',
            id: parentOrderItem.id,
            menuItemId: parentMenuItem.id,
            menuItemSizeId: parentMenuItem.validSizes[0].id,
            quantity: 1,
            orderedItemContainerDtos: containerDtos,
        } as UpdateChildOrderMenuItemDto;

        const result = await validator.validateUpdate(parentOrderItem.id, dto);
        expect(result).toEqual(`order item container updates dtos cannot have multiple update request for the same entity.`);
    });
});