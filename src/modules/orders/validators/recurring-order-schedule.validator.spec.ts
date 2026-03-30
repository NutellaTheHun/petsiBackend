import { TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { plainToInstance } from "class-transformer";
import { Repository } from "typeorm";
import { createValidationErrorPayload, expectValidationErrorPayload, expectValidationErrorSize } from "../../../common/validation/validation-error";
import { DatabaseTestContext } from "../../../test/DatabaseTestContext";
import { NestedCreateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/nested-create-recurring-order-schedule.dto";
import { RecurringOrderSchedule } from "../entities/recurring-order-schedule.entity";
import { recurringOrderScheduleToUpdateDto } from "../utils/entity-transformers/recurring-order-schedule.dto.transformer";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderTestingUtil } from "../utils/order-testing.util";
import { RecurringOrderScheduleValidator } from "./recurring-order-schedule.validator";

describe('recurring order schedule validator', () => {
    let testingUtil: OrderTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: RecurringOrderScheduleValidator;
    let recurringOrderScheduleRepo: Repository<RecurringOrderSchedule>;

    const getRecurringOrderSchedule = async () => {
        return await recurringOrderScheduleRepo.findOneOrFail({ where: {} });
    }

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<OrderTestingUtil>(OrderTestingUtil);
        await testingUtil.initOrderMenuItemTestDatabase(dbTestContext);

        validator = module.get<RecurringOrderScheduleValidator>(RecurringOrderScheduleValidator);
        recurringOrderScheduleRepo = module.get(getRepositoryToken(RecurringOrderSchedule));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined;
    });

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