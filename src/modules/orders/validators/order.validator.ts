import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order, OrderEntity } from '../entities/order.entity';
import { OrderMenuItemValidator } from './order-menu-item.validator';
import { OrderMenuItemPatchValidator } from './patch-validators/order-menu-item.patch.validator';

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
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    await this.helper.enforceNotEmpty(
      dto.orderedItems,
      'orderedItems',
      results,
      'Order has no items',
      id,
    );

    //valid fulfillment type value
    const validFulfillmentType = ['pickup', 'delivery'];
    if (!validFulfillmentType.includes(dto.fulfillmentType)) {
      const err = new ValidationErrorNode(
        'fulfillmentType',
        id,
        'Invalid fulfillmentType value',
      );
      results.push(err);
    }

    this.helper.enforceConditionalRequired(
      dto,
      'fulfillmentType',
      'delivery',
      ['deliveryAddress', 'phoneNumber'],
      results,
      'Order for delivery must have a delivery address',
      id,
    );

    this.helper.enforceConditionalRequired(
      dto,
      'isWeekly',
      true,
      ['weeklyFulfillment'],
      results,
      'Order must have a day of the week selected for fulfillment',
      id,
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
      const err = new ValidationErrorNode(
        'weeklyFulfillment',
        id,
        'Invalid weeklyFulfillment value',
      );
      results.push(err);
    }

    // Check duplicate menuItem / menuItemSize combinations
    // handle duplicate container contents
    const omiValidator = new OrderMenuItemPatchValidator(dto.orderedItems);

    // Currently doesnt provide ID of nested item, only providing parent ID (create ID)
    omiValidator.validateUnique(
      'orderedItems',
      results,
      'duplicate order menu item',
      id,
    );

    // nested validator call
    const nestedDtoErrs = await this.orderItemValidator.validateManyNestedNode(
      'orderedItems',
      dto.orderedItems,
    );
    if (nestedDtoErrs) {
      results.push(nestedDtoErrs);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateOrderDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

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
      const err = new ValidationErrorNode(
        'weeklyFulfillment',
        id,
        'Invalid weeklyFulfillment value',
      );
      results.push(err);
    }

    // validate fulfillmentType
    const validFulfillmentType = ['pickup', 'delivery'];
    if (
      dto.fulfillmentType &&
      !validFulfillmentType.includes(dto.fulfillmentType)
    ) {
      const err = new ValidationErrorNode(
        'fulfillmentType',
        id,
        'Invalid fulfillmentType value',
      );
      results.push(err);
    }

    this.helper.enforceConditionalRequired(
      dto,
      'fulfillmentType',
      'delivery',
      ['deliveryAddress', 'phoneNumber'],
      results,
      'Order for delivery must have a delivery address',
      id,
    );

    this.helper.enforceConditionalRequired(
      dto,
      'isWeekly',
      true,
      ['weeklyFulfillment'],
      results,
      'Order must have a day of the week selected for fulfillment',
      id,
    );

    // check for duplicate ordered items (menuItem / Size combinations)
    if (dto.orderedItems?.length) {
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

      const omiValidator = new OrderMenuItemPatchValidator(
        dto.orderedItems,
        currentItems,
      );

      omiValidator.validateUnique(
        'orderedItems',
        results,
        'duplicate order menu item',
        id,
      );

      // nested validator call
      const nestedDtoErrs =
        await this.orderItemValidator.validateManyNestedNode(
          'orderedItems',
          dto.orderedItems,
        );
      if (nestedDtoErrs) {
        results.push(nestedDtoErrs);
      }
    }

    return this.checkValidateResult(results);
  }
}
