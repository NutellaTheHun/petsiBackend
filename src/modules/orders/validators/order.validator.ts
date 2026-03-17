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
import { OCCURENCE_STATES, OCCURENCE_TYPES } from '../utils/occurence-types';
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

        if (identity.isWeekly) {
            this.helper.enforceConditionalRequired(
                identity,
                'isWeekly',
                true,
                ['weeklyFulfillment'],
                errorMap,
            );
        }

        //if (identity.note) { }

        //if (identity.phoneNumber) { }

        //if (identity.recipient) { }

        if (identity.weeklyFulfillment) {
            const validDays = [
                'sunday',
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
            ];
            if (!validDays.includes(identity.weeklyFulfillment)) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['weeklyFulfillment']);
            }
        }

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

        if (identity.templateOrderId !== undefined) {
            await this.helper.enforceExists(
                identity.templateOrderId,
                this.repo,
                'templateOrderId',
                errorMap,
            );
        }

        if (identity.occurenceType !== undefined) {
            // get occuren types as strings
            const validOccurenceTypes = Object.values(OCCURENCE_TYPES).map(type => type.toString());
            if (!validOccurenceTypes.includes(identity.occurenceType)) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['occurenceType']);
            }
        }

        if (identity.occurenceState !== undefined) {
            const validOccurenceStates = Object.values(OCCURENCE_STATES).map(state => state.toString());
            if (!validOccurenceStates.includes(identity.occurenceState)) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['occurenceState']);
            }
        }

        /*if (identity.reccurenceDate !== undefined) {
        }*/

        if (identity.reccurenceSchedule) {
            await this.recurringOrderScheduleValidator.validateNestedIdentity(
                'reccurenceSchedule',
                identity.reccurenceSchedule,
                errorMap,
            );
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

        let reccurenceSchedule: RecurringOrderScheduleValidatorIdentity | undefined;
        if (dto.recurrenceSchedule) {
            const id = 'id' in dto.recurrenceSchedule ? dto.recurrenceSchedule.id : dto.recurrenceSchedule.createId;
            reccurenceSchedule = await this.recurringOrderScheduleValidator.resolveIdentity(dto.recurrenceSchedule, id);
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
            templateOrderId: dto.templateOrderId,
            occurenceType: dto.occurenceType,
            occurenceState: dto.occurenceState,
            reccurenceSchedule: reccurenceSchedule ?? undefined,
        } as OrderValidatorIdentity;
    }
}
