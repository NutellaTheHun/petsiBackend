import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order, OrderEntity } from '../entities/order.entity';
import { OrderMenuItemAggregateValidator } from './aggregate-validators/order-menu-item.aggregate.validator';
import { OrderMenuItemValidator } from './order-menu-item.validator';
import { OrderMenuItemValidatorIdentity } from './validation-identities/order-menu-item.validator.identity.interface';
import { OrderValidatorIdentity } from './validation-identities/order.validator.identity.interface';

@Injectable()
export class OrderValidator extends ValidatorBase<OrderEntity, OrderValidatorIdentity> {

    constructor(
        @InjectRepository(Order)
        private readonly repo: Repository<Order>,

        private readonly orderItemValidator: OrderMenuItemValidator,

        @InjectRepository(OrderMenuItem)
        private readonly orderMenuItemRepo: Repository<OrderMenuItem>,

        @InjectRepository(OrderCategory)
        private readonly orderCategoryRepo: Repository<OrderCategory>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'Order', requestContextService, logger);
    }

    protected async validateIdentity(identity: OrderValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.categoryId) {
            await this.helper.enforceExists(
                identity.categoryId,
                this.orderCategoryRepo,
                'category',
                errorMap,
            );
        }

        if (identity.deliveryAddress) { }

        if (identity.email) { }

        if (identity.fulfillmentContactName) { }

        if (identity.fulfillmentDate) { }

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

        if (identity.isFrozen) { }

        if (identity.isWeekly) {
            this.helper.enforceConditionalRequired(
                identity,
                'isWeekly',
                true,
                ['weeklyFulfillment'],
                errorMap,
            );
        }

        if (identity.note) { }

        if (identity.phoneNumber) { }

        if (identity.recipient) { }

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


            // Nested Validator Call
            for (const item of identity.orderedItems) {
                await this.orderItemValidator.validateNestedIdentity(
                    'orderedItems',
                    item,
                    errorMap,
                );
            }
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateOrderDto | UpdateOrderDto, id: number | string): Promise<OrderValidatorIdentity> {
        let itemIdentities: OrderMenuItemValidatorIdentity[] = [];

        if (dto instanceof CreateOrderDto) {
            if (dto.orderedItems && dto.orderedItems.length > 0) {
                for (const item of dto.orderedItems) {
                    itemIdentities.push(await this.orderItemValidator.resolveIdentity(item, item.createId));
                }
            }
            return {
                categoryId: dto.categoryId,
                deliveryAddress: dto.deliveryAddress,
                email: dto.email,
                fulfillmentContactName: dto.fulfillmentContactName,
                fulfillmentDate: dto.fulfillmentDate,
                fulfillmentType: dto.fulfillmentType,
                isFrozen: dto.isFrozen,
                isWeekly: dto.isWeekly,
                note: dto.note,
                phoneNumber: dto.phoneNumber,
                recipient: dto.recipient,
                weeklyFulfillment: dto.weeklyFulfillment,
                orderedItems: itemIdentities.length > 0 ? itemIdentities : undefined,
            } as OrderValidatorIdentity;
        }


        const currentOrder = await this.repo.findOne({
            where: { id: id as number } as FindOptionsWhere<Order>,
            relations: [
                'orderedItems',
                'orderedItems.menuItem',
                'orderedItems.size',
            ],
        });
        if (!currentOrder) {
            throw new Error('Order not found');
        }
        // merge current items and orderItemDtos to identities.... create and update items

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
        );

        this.helper.enforceConditionalRequired(
            dto,
            'isWeekly',
            true,
            ['weeklyFulfillment'],
            errorMap,
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
            );
        }

        if (dto.isWeekly) {
            this.helper.enforceConditionalRequired(
                dto,
                'isWeekly',
                true,
                ['weeklyFulfillment'],
                errorMap,
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
