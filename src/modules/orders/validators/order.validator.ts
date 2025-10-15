import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { Order, OrderEntity } from '../entities/order.entity';
import { OrderMenuItemService } from '../services/order-menu-item.service';
import { OrderMenuItemValidator } from './order-menu-item.validator';

@Injectable()
export class OrderValidator extends ValidatorBase<OrderEntity> {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,

    @Inject(forwardRef(() => OrderMenuItemService))
    private readonly itemService: OrderMenuItemService,
    logger: AppLogger,
    requestContextService: RequestContextService,
    private readonly orderItemValidator: OrderMenuItemValidator,
  ) {
    super(repo, 'Order', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateOrderDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.orderedMenuItemDtos.length === 0) {
      const err = new ValidationErrorNode(
        'orderedItems',
        undefined,
        'Order has no items',
      );
      results.push(err);
    }

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
        undefined,
        'Invalid weeklyFulfillment value',
      );
      results.push(err);
    }

    //valid fulfillment type value
    const validFulfillmentType = ['pickup', 'delivery'];
    if (!validFulfillmentType.includes(dto.fulfillmentType)) {
      const err = new ValidationErrorNode(
        'fulfillmentType',
        undefined,
        'Invalid fulfillmentType value',
      );
      results.push(err);
    }

    const nestedDtoErrs = await this.orderItemValidator.validateManyNestedNode(
      'orderedItems',
      dto.orderedMenuItemDtos,
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
        undefined,
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
        undefined,
        'Invalid fulfillmentType value',
      );
      results.push(err);
    }

    if (dto.orderedMenuItemDtos && dto.orderedMenuItemDtos.length > 0) {
      const nestedDtoErrs =
        await this.orderItemValidator.validateManyNestedNode(
          'orderedItems',
          dto.orderedMenuItemDtos,
        );
      if (nestedDtoErrs) {
        results.push(nestedDtoErrs);
      }
    }

    return this.checkValidateResult(results);
  }
}
