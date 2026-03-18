import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { Order, OrderEntity } from '../entities/order.entity';
import { OCCURRENCE_STATES, OCCURRENCE_TYPES } from '../utils/occurence-types';
import { OrderMenuItemValidatorIdentity } from './identities/order-menu-item.validator.identity.interface';
import { OrderValidatorIdentity } from './identities/order.validator.identity.interface';
import { RecurringOrderScheduleValidatorIdentity } from './identities/recurring-order-schedule.identity.interface';
import { OrderMenuItemValidator } from './order-menu-item.validator';
import { RecurringOrderScheduleValidator } from './recurring-order-schedule.validator';

@Injectable()
export class OrderValidator extends ValidatorBase<OrderEntity, OrderValidatorIdentity> {

    constructor(
        @InjectRepository(Order)
        private readonly repo: Repository<Order>,

        private readonly orderItemValidator: OrderMenuItemValidator,

        @InjectRepository(OrderCategory)
        private readonly orderCategoryRepo: Repository<OrderCategory>,

        private readonly recurringOrderScheduleValidator: RecurringOrderScheduleValidator,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'Order', requestContextService, logger);
    }

    protected async validateIdentity(identity: OrderValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.categoryId !== undefined) {
            await this.helper.enforceExists(
                identity.categoryId,
                this.orderCategoryRepo,
                'category',
                errorMap,
            );
        }

        //if (identity.deliveryAddress) { }

        //if (identity.email) { }

        //if (identity.fulfillmentContactName) { }

        //if (identity.fulfillmentDate) { }

        if (identity.fulfillmentType) {
            const validFulfillmentType = ['pickup', 'delivery'];
            if (!validFulfillmentType.includes(identity.fulfillmentType)) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['fulfillmentType']);
            }
            this.helper.enforceConditionalRequired(
                identity,
                'fulfillmentType',
                'delivery',
                ['deliveryAddress', 'phoneNumber'],
                errorMap,
            );
        }

        //if (identity.isFrozen) { }

        //if (identity.note) { }

        //if (identity.phoneNumber) { }

        //if (identity.recipient) { }

        if (identity.orderedItems && identity.orderedItems.length > 0) {
            // Check Duplicates
            this.helper.enforceNoDuplicateElements(
                identity.orderedItems,
                (item) => ({ id: item.id ?? item.createId, identity: `${item.menuItemId}:${item.sizeId}` }),
                'orderedItems',
                errorMap,
            );

            // Nested Validator Call
            for (const item of identity.orderedItems) {
                await this.orderItemValidator.validateNestedIdentity(
                    'orderedItems',
                    item,
                    errorMap,
                );
            }
        }

        if (identity.occurrenceType !== null && identity.occurrenceType !== undefined) {
            const validOccurenceTypes = Object.values(OCCURRENCE_TYPES).map(type => type.toString());
            if (!validOccurenceTypes.includes(identity.occurrenceType)) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['occurenceType']);
            }
        }

        if (identity.occurrenceState !== null && identity.occurrenceState !== undefined) {
            const validoccurrenceStates = Object.values(OCCURRENCE_STATES).map(state => state.toString());
            if (!validoccurrenceStates.includes(identity.occurrenceState)) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['occurrenceState']);
            }
        }

        /*if (identity.reccurenceDate !== undefined) {
        }*/

        if (identity.templateOrderId !== null && identity.templateOrderId !== undefined) {
            await this.helper.enforceExists(
                identity.templateOrderId,
                this.repo,
                'templateOrderId',
                errorMap,
            );
            // occurence type must be set to OCCURENCE
            if (identity.occurrenceType !== OCCURRENCE_TYPES.OCCURRENCE) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['occurrenceState']);
            }
            // must have a occurence state
            if (identity.occurrenceState === undefined) {
                errorMap.addError('MISSING_PROPERTY', undefined, ['occurrenceState']);
            }
        }

        if (identity.recurrenceSchedule) {
            await this.recurringOrderScheduleValidator.validateNestedIdentity(
                'recurrenceSchedule',
                identity.recurrenceSchedule,
                errorMap,
            );

            // occurence type must be set to TEMPLATE
            if (identity.occurrenceType !== OCCURRENCE_TYPES.TEMPLATE) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['occurrenceState']);
            }

            // occurence state must be null or undefined
            if (identity.occurrenceState !== null && identity.occurrenceState !== undefined) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['occurrenceState']);
            }
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateOrderDto | UpdateOrderDto, id: number | string): Promise<OrderValidatorIdentity> {
        const orderedItems: OrderMenuItemValidatorIdentity[] = [];
        if (dto.orderedItems && dto.orderedItems.length) {
            for (const item of dto.orderedItems) {
                const itemId = item instanceof NestedCreateOrderMenuItemDto ? item.createId : item.id;
                orderedItems.push(await this.orderItemValidator.resolveIdentity(item, itemId));
            }
        }

        let recurrenceSchedule: RecurringOrderScheduleValidatorIdentity | undefined;
        if (dto.recurrenceSchedule) {
            const id = 'id' in dto.recurrenceSchedule ? dto.recurrenceSchedule.id : dto.recurrenceSchedule.createId;
            recurrenceSchedule = await this.recurringOrderScheduleValidator.resolveIdentity(dto.recurrenceSchedule, id);
        }

        return {
            recipient: dto.recipient,
            fulfillmentDate: dto.fulfillmentDate,
            fulfillmentType: dto.fulfillmentType,
            fulfillmentContactName: dto.fulfillmentContactName,
            deliveryAddress: dto.deliveryAddress,
            phoneNumber: dto.phoneNumber,
            email: dto.email,
            note: dto.note,
            isFrozen: dto.isFrozen,
            isWeekly: dto.isWeekly,
            weeklyFulfillment: dto.weeklyFulfillment,
            categoryId: dto.categoryId,
            orderedItems: orderedItems,
            templateOrderId: 'templateOrderId' in dto ? dto.templateOrderId ?? undefined : undefined,
            occurrenceType: dto.occurrenceType,
            occurrenceState: dto.occurrenceState,
            recurrenceSchedule,
        } as OrderValidatorIdentity;
    }
}
