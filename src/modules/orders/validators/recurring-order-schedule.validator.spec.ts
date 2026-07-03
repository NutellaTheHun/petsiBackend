import { TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { plainToInstance } from "class-transformer";
import { Repository } from "typeorm";
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from "../../../common/validation/validation-error";
import { MenuItemCategory } from "../../menu-items/entities/menu-item-category.entity";
import { MenuItemContainerItem } from "../../menu-items/entities/menu-item-container-item.entity";
import { MenuItemSize } from "../../menu-items/entities/menu-item-size.entity";
import { MenuItem } from "../../menu-items/entities/menu-item.entity";
import { NestedCreateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/nested-create-recurring-order-schedule.dto";
import { OrderCategory } from "../entities/order-category.entity";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { Order } from "../entities/order.entity";
import { RecurringOrderSchedule } from "../entities/recurring-order-schedule.entity";
import { recurringOrderScheduleToUpdateDto } from "../utils/entity-transformers/recurring-order-schedule.dto.transformer";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { RecurringOrderScheduleValidator } from "./recurring-order-schedule.validator";

const P = `t${Date.now()}`;

describe('recurring order schedule validator', () => {
    let validator: RecurringOrderScheduleValidator;
    let orderRepo: Repository<Order>;
    let categoryRepo: Repository<OrderCategory>;
    let orderMenuItemRepo: Repository<OrderMenuItem>;
    let menuItemRepo: Repository<MenuItem>;
    let menuItemContainerItemRepo: Repository<MenuItemContainerItem>;
    let menuItemCategoryRepo: Repository<MenuItemCategory>;
    let menuItemSizeRepo: Repository<MenuItemSize>;
    let recurringOrderScheduleRepo: Repository<RecurringOrderSchedule>;

    let categories: OrderCategory[];
    let orders: Order[];
    let singleItems: MenuItem[];
    let fixedContainerItems: MenuItem[];
    let varContainerItems: MenuItem[];
    let containerLines: MenuItemContainerItem[];
    let orderMenuItems: OrderMenuItem[];
    let recurringOrder: Order;
    let recurringOrderSchedule: RecurringOrderSchedule;
    let menuItemCategories: MenuItemCategory[];
    let menuItemSizes: MenuItemSize[];

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        const testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);

        validator = module.get<RecurringOrderScheduleValidator>(RecurringOrderScheduleValidator);
        orderRepo = module.get(getRepositoryToken(Order));
        categoryRepo = module.get(getRepositoryToken(OrderCategory));
        orderMenuItemRepo = module.get(getRepositoryToken(OrderMenuItem));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        menuItemContainerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
        menuItemCategoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        menuItemSizeRepo = module.get(getRepositoryToken(MenuItemSize));
        recurringOrderScheduleRepo = module.get(getRepositoryToken(RecurringOrderSchedule));

        ({
            categories, orders, singleItems, fixedContainerItems, varContainerItems,
            containerLines, orderMenuItems, recurringOrder, recurringOrderSchedule,
            menuItemCategories, menuItemSizes,
        } = await testingUtil.seedRecurringOrder(P));
    });

    afterAll(async () => {
        await orderRepo.delete(recurringOrder.id);
        await orderMenuItemRepo.delete(orderMenuItems.map((i) => i.id));
        await orderRepo.delete(orders.map((o) => o.id));
        await categoryRepo.delete(categories.map((c) => c.id));
        await menuItemContainerItemRepo.delete(containerLines.map((l) => l.id));
        await menuItemRepo.delete([...singleItems, ...fixedContainerItems, ...varContainerItems].map((i) => i.id));
        await menuItemSizeRepo.delete(menuItemSizes.map((s) => s.id));
        await menuItemCategoryRepo.delete(menuItemCategories.map((c) => c.id));
    });

    const getRecurringOrderSchedule = async () => {
        return await recurringOrderScheduleRepo.findOneOrFail({ where: { id: recurringOrderSchedule.id } });
    }

    // Create Validation Tests
    it('successfully validate create: no validation errors', async () => {
        const dto: NestedCreateRecurringOrderScheduleDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'WEEKLY',
            interval: 1,
            daysOfWeek: [1],
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 3)),
            timezone: 'America/New_York',
        });

        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    // fail create invalid frequency
    it('fail create invalid frequency', async () => {
        const dto: NestedCreateRecurringOrderScheduleDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'invalid' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
            startDate: new Date(),
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['frequency']));
    });
    // fail create invalid interval
    it('fail create invalid interval', async () => {
        const dto: NestedCreateRecurringOrderScheduleDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'WEEKLY',
            startDate: new Date(),
            interval: -1,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['interval']));
    });

    // fail create invalid daysOfWeek
    it('fail create invalid daysOfWeek', async () => {
        const dto: NestedCreateRecurringOrderScheduleDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'WEEKLY',
            startDate: new Date(),
            daysOfWeek: [7],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['daysOfWeek']));
    });

    // fail create invalid dayOfMonth
    it('fail create invalid dayOfMonth', async () => {
        const dto: NestedCreateRecurringOrderScheduleDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'WEEKLY',
            startDate: new Date(),
            dayOfMonth: 32,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['dayOfMonth']));
    });

    // fail create invalid monthOfYear
    it('fail create invalid monthOfYear', async () => {
        const dto: NestedCreateRecurringOrderScheduleDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'WEEKLY',
            startDate: new Date(),
            monthOfYear: 13,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['monthOfYear']));
    });

    // fail create invalid startDate
    /*it('fail create invalid startDate', async () => {
        const dto: NestedCreateRecurringOrderScheduleDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'WEEKLY',
            startDate: new Date(new Date().setDate(new Date().getDate() - 1)),
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['startDate']));
    });*/

    // fail create invalid endDate
    it('fail create invalid endDate', async () => {
        const dto: NestedCreateRecurringOrderScheduleDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'WEEKLY',
            startDate: new Date(new Date().setDate(new Date().getDate() + 3)),
            endDate: new Date(new Date().setDate(new Date().getDate() + 2)),
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['endDate']));
    });

    // fail create invalid timeZone
    it('fail create invalid timeZone', async () => {
        const dto: NestedCreateRecurringOrderScheduleDto = plainToInstance(NestedCreateRecurringOrderScheduleDto, {
            createId: 'r1',
            frequency: 'WEEKLY',
            startDate: new Date(),
            timezone: 'invalid',
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['timezone']));
    });

    // pass update validation: no validation errors
    it('pass update validation: no validation errors', async () => {
        const recurringOrderSchedule = await getRecurringOrderSchedule();
        const dto = recurringOrderScheduleToUpdateDto(recurringOrderSchedule);
        const errors = await validator.validateDto(dto, 'root');
        expect(errors).toBeNull();
    });

    // fail update invalid frequency
    it('fail update invalid frequency', async () => {
        const entity = await getRecurringOrderSchedule();
        const dto = recurringOrderScheduleToUpdateDto(entity, {
            frequency: 'invalid' as any,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['frequency']));
    });

    // fail update invalid interval
    it('fail update invalid interval', async () => {
        const entity = await getRecurringOrderSchedule();
        const dto = recurringOrderScheduleToUpdateDto(entity, {
            interval: -1,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['interval']));
    });


    // fail update invalid daysOfWeek
    it('fail update invalid daysOfWeek', async () => {
        const entity = await getRecurringOrderSchedule();
        const dto = recurringOrderScheduleToUpdateDto(entity, {
            daysOfWeek: [7],
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['daysOfWeek']));
    });

    // fail update invalid dayOfMonth
    it('fail update invalid dayOfMonth', async () => {
        const entity = await getRecurringOrderSchedule();
        const dto = recurringOrderScheduleToUpdateDto(entity, {
            dayOfMonth: 32,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['dayOfMonth']));
    });

    // fail update invalid monthOfYear
    it('fail update invalid monthOfYear', async () => {
        const entity = await getRecurringOrderSchedule();
        const dto = recurringOrderScheduleToUpdateDto(entity, {
            monthOfYear: 13,
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['monthOfYear']));
    });
    // fail update invalid startDate
    /*it('fail update invalid startDate', async () => {
        const entity = await getRecurringOrderSchedule();
        const dto = recurringOrderScheduleToUpdateDto(entity, {
            startDate: new Date(new Date().setDate(new Date().getDate() - 1)),
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['startDate']));
    });*/

    // fail update invalid endDate
    it('fail update invalid endDate', async () => {
        const entity = await getRecurringOrderSchedule();
        const dto = recurringOrderScheduleToUpdateDto(entity, {
            startDate: new Date(new Date().setDate(new Date().getDate() + 3)),
            endDate: new Date(new Date().setDate(new Date().getDate() + 2)),
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['endDate']));
    });

    // fail update invalid timeZone
    it('fail update invalid timeZone', async () => {
        const entity = await getRecurringOrderSchedule();
        const dto = recurringOrderScheduleToUpdateDto(entity, {
            timezone: 'invalid',
        });

        const errors = await validator.validateDto(dto, 'root');
        expectValidationErrorSize(errors, 1);
        expectValidationErrorPayload(errors, [], createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['timezone']));
    });

});