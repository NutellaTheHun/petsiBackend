import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { item_a, item_b, item_c } from "../../menu-items/utils/constants";
import { CreateOrderCategoryDto } from "../dto/order-category/create-order-category.dto";
import { UpdateOrderCategoryDto } from "../dto/order-category/update-order-category.dto";
import { CreateChildOrderContainerItemDto } from "../dto/order-container-item/create-child-order-container-item.dto";
import { CreateChildOrderMenuItemDto } from "../dto/order-menu-item/create-child-order-menu-item.dto";
import { OrderMenuItemService } from "../services/order-menu-item.service";
import { TYPE_A, TYPE_B } from "../utils/constants";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { OrderMenuItemValidator } from "./order-menu-item.validator";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { UpdateChildOrderMenuItemDto } from "../dto/order-menu-item/update-child-order-menu-item.dto";

describe('order category validator', () => {
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: OrderMenuItemValidator;
    let service: OrderMenuItemService;
    let menuItemService: MenuItemService;

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        validator = module.get<OrderMenuItemValidator>(OrderMenuItemValidator);

        service = module.get<OrderMenuItemService>(OrderMenuItemService);
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
        const item = await menuItemService.findOneByName(item_a, ['validSizes']);
        if(!item){ throw new Error(); }

        const contItemB = await menuItemService.findOneByName(item_b, ['validSizes']);
        if(!contItemB){ throw new Error(); }
        const contItemC = await menuItemService.findOneByName(item_c, ['validSizes']);
        if(!contItemC){ throw new Error(); }

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

    it('should fail create (name already exists)', async () => {
        const dto = {
            
        } as CreateChildOrderMenuItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`Order category with name ${TYPE_A} already exists`);
    });

    it('should pass update', async () => {
        const items = await (await service.findAll({ relations: ['order'] })).items
        if(!items){ throw new Error(); }

        const toUpdate = items[0];

        const dto = {
            
        } as UpdateChildOrderMenuItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update (name already exists)', async () => {
        const items = await (await service.findAll({ relations: ['order'] })).items
        if(!items){ throw new Error(); }

        const toUpdate = items[0];

        const dto = {
            
        } as UpdateChildOrderMenuItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Order category with name ${TYPE_B} already exists`);
    });
});