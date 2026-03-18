import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NestedValidatorBase } from "../../../common/base/nested-validator.base";
import { ValidationErrorMap } from "../../../common/validation/validation-error";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/create-recurring-order-schedule.dto";
import { NestedCreateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/nested-create-recurring-order-schedule.dto";
import { NestedUpdateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/nested-update-recurring-order-schedule.dto";
import { UpdateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/update-recurring-order-schedule.dto";
import { Order } from "../entities/order.entity";
import { RecurringOrderSchedule, RecurringOrderScheduleEntity } from "../entities/recurring-order-schedule.entity";
import { RecurringOrderScheduleValidatorIdentity } from "./identities/recurring-order-schedule.identity.interface";

export class RecurringOrderScheduleValidator extends NestedValidatorBase<RecurringOrderScheduleEntity, RecurringOrderScheduleValidatorIdentity> {
    constructor(
        @InjectRepository(RecurringOrderSchedule)
        private readonly repo: Repository<RecurringOrderSchedule>,

        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'RecurringOrderSchedule', requestContextService, logger);
    }

    public async resolveIdentity(dto: CreateRecurringOrderScheduleDto | UpdateRecurringOrderScheduleDto | NestedCreateRecurringOrderScheduleDto | NestedUpdateRecurringOrderScheduleDto, id: number | string): Promise<RecurringOrderScheduleValidatorIdentity> {
        return {
            orderId: 'orderId' in dto ? dto.orderId : undefined,
            createId: 'createId' in dto ? dto.createId : undefined,
            id: 'id' in dto ? dto.id : undefined,
            frequency: dto.frequency,
            interval: dto.interval,
            daysOfWeek: dto.daysOfWeek,
            dayOfMonth: dto.dayOfMonth,
            monthOfYear: dto.monthOfYear,
            startDate: dto.startDate,
            endDate: dto.endDate,
            timezone: dto.timezone,
        } as RecurringOrderScheduleValidatorIdentity;
    }

    protected async validateIdentity(identity: RecurringOrderScheduleValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.orderId !== undefined) {
            await this.helper.enforceExists(
                identity.orderId,
                this.orderRepo,
                'order',
                errorMap,
            );
        }

        if (identity.frequency !== undefined) {
            const validFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
            if (!validFrequencies.includes(identity.frequency)) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['frequency']);
            }
        }

        if (identity.interval !== undefined) {
            if (identity.interval <= 0) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['interval']);
            }
        }

        if (identity.daysOfWeek !== undefined) {
            if (identity.daysOfWeek.length === 0) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['daysOfWeek']);
            }
            // each value must be between 0 and 6
            for (const day of identity.daysOfWeek) {
                if (day < 0 || day > 6) {
                    errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['daysOfWeek']);
                }
            }
        }

        if (identity.dayOfMonth !== undefined) {
            // each value must be between 1 and 31
            if (identity.dayOfMonth < 1 || identity.dayOfMonth > 31) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['dayOfMonth']);
            }

        }

        if (identity.monthOfYear !== undefined) {
            // each value must be between 1 and 12
            if (identity.monthOfYear < 1 || identity.monthOfYear > 12) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['monthOfYear']);
            }

        }

        /*if (identity.startDate !== undefined) {

        }*/

        if (identity.endDate !== undefined) {
            if (identity.endDate <= new Date()) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['endDate']);
            }

            // start date must be before end date
            if (identity.startDate !== undefined && identity.endDate !== undefined
                && identity.startDate >= identity.endDate) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['endDate']);
            }
        }

        if (identity.timezone !== undefined) {
            const validTimezones = [
                "America/New_York",
                "Europe/London",
                "Asia/Tokyo"
            ];

            if (!validTimezones.includes(identity.timezone)) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['timezone']);
            }
        }

        return errorMap;
    }
}
