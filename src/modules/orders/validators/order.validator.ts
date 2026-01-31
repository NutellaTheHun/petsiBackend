import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order, OrderEntity } from '../entities/order.entity';
import { OrderMenuItemAggregateValidator } from './aggregate-validators/order-menu-item.aggregate.validator';
import { OrderMenuItemValidator } from './order-menu-item.validator';

@Injectable()
export class OrderValidator extends ValidatorBase<OrderEntity> {
    constructor(
        @InjectRepository(Order)
        private readonly repo: Repository<Order>,

        private readonly orderItemValidator: OrderMenuItemValidator,

        @InjectRepository(OrderMenuItem)
        private readonly orderMenuItemRepo: Repository<OrderMenuItem>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'Order', requestContextService, logger);
    }

    protected async doValidateCreateNode(
        dto: CreateOrderDto,
        id?: string,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        this.helper.enforceArrayNotEmpty(
            dto.orderedItems,
            'orderedItems',
            errorMap,
            'Order has no items',
        );

        //valid fulfillment type value
        const validFulfillmentType = ['pickup', 'delivery'];
        if (!validFulfillmentType.includes(dto.fulfillmentType)) {
            errorMap.addChild(
                'fulfillmentType',
                new ValidationErrorMap(undefined, 'Invalid fulfillmentType value'),
            );
        }

        this.helper.enforceConditionalRequired(
            dto,
            'fulfillmentType',
            'delivery',
            ['deliveryAddress', 'phoneNumber'],
            errorMap,
            'Order for delivery must have a delivery address',
        );

        this.helper.enforceConditionalRequired(
            dto,
            'isWeekly',
            true,
            ['weeklyFulfillment'],
            errorMap,
            'Order must have a day of the week selected for fulfillment',
        );

        // valid day of the week value
        const validDays = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
        ];
        if (dto.weeklyFulfillment && !validDays.includes(dto.weeklyFulfillment)) {
            errorMap.addChild(
                'weeklyFulfillment',
                new ValidationErrorMap(undefined, 'Invalid weeklyFulfillment value'),
            );
        }

        // Check duplicate menuItem / menuItemSize combinations
        // handle duplicate container contents
        const omiValidator = new OrderMenuItemAggregateValidator(dto.orderedItems);

        // Currently doesnt provide ID of nested item, only providing parent ID (create ID)
        omiValidator.validateUnique(
            'orderedItems',
            errorMap,
            'duplicate order menu item',
        );

        // nested validator call
        await this.orderItemValidator.validateManyNestedNode(
            'orderedItems',
            dto.orderedItems,
            errorMap,
        );

        return errorMap;
    }

    protected async doValidateUpdateNode(
        dto: UpdateOrderDto,
        id: number,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        // valididate weeklyFulfillment
        const validDays = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
        ];
        if (dto.weeklyFulfillment && !validDays.includes(dto.weeklyFulfillment)) {
            errorMap.addChild(
                'weeklyFulfillment',
                new ValidationErrorMap(undefined, 'Invalid weeklyFulfillment value'),
            );
        }

        // validate fulfillmentType
        const validFulfillmentType = ['pickup', 'delivery'];
        if (
            dto.fulfillmentType &&
            !validFulfillmentType.includes(dto.fulfillmentType)
        ) {
            errorMap.addChild(
                'fulfillmentType',
                new ValidationErrorMap(undefined, 'Invalid fulfillmentType value'),
            );
        }

        if (dto.fulfillmentType) {
            this.helper.enforceConditionalRequired(
                dto,
                'fulfillmentType',
                'delivery',
                ['deliveryAddress', 'phoneNumber'],
                errorMap,
                'Order for delivery must have a delivery address',
            );
        }

        if (dto.isWeekly) {
            this.helper.enforceConditionalRequired(
                dto,
                'isWeekly',
                true,
                ['weeklyFulfillment'],
                errorMap,
                'Order must have a day of the week selected for fulfillment',
            );
        }

        // check for duplicate ordered items (menuItem / Size combinations)
        if (dto.orderedItems && dto.orderedItems?.length) {
            // Check duplicate menuItem / menuItemSize combinations
            // handle duplicate container contents

            const currentItems = await this.orderMenuItemRepo.find({
                where: {
                    parentOrder: {
                        id: id,
                    },
                },
                relations: [
                    'menuItem',
                    'size',
                    'containerOrderMenuItems',
                    'containerOrderMenuItems.containedMenuItem',
                    'containerOrderMenuItems.containedItemSize',
                ],
            });

            const omiValidator = new OrderMenuItemAggregateValidator(
                dto.orderedItems,
                currentItems,
            );

            omiValidator.validateUnique(
                'orderedItems',
                errorMap,
                'duplicate order menu item',
            );

            // nested validator call
            await this.orderItemValidator.validateManyNestedNode(
                'orderedItems',
                dto.orderedItems,
                errorMap,
            );
        }

        return errorMap;
    }
}
