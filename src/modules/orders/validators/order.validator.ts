import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { Order, OrderEntity } from '../entities/order.entity';
import { OrderMenuItemValidator } from './order-menu-item.validator';

@Injectable()
export class OrderValidator extends ValidatorBase<OrderEntity> {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,

    private readonly orderItemValidator: OrderMenuItemValidator,

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

    if (dto.orderedItemDtos.length === 0) {
      const err = new ValidationErrorNode(
        'orderedItems',
        id,
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
        id,
        'Invalid weeklyFulfillment value',
      );
      results.push(err);
    }

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

    if (dto.fulfillmentType === 'delivery' && !dto.deliveryAddress) {
      const err = new ValidationErrorNode(
        'deliveryAddress',
        id,
        'Order for delivery must have a delivery address',
      );
      results.push(err);
    }

    if (dto.isWeekly && !dto.weeklyFulfillment) {
      const err = new ValidationErrorNode(
        'weeklyFulfillment',
        id,
        'Order must have a day of the week selected for fulfillment',
      );
      results.push(err);
    }

    // check for duplicate orderMenuItems, (menuItem / menuItemSize combinations)
    // DOESNT HANDLE CONTAINERS
    // False negative with 2 boxes of cookies with different contents
    const seen = new Set<string>();
    for (const nestedDto of dto.orderedItemDtos) {
      if (!nestedDto.createDto) {
        throw new Error(
          'create order validation: orderMenuItem dto has no createDto',
        );
      }
      const dto = nestedDto.createDto;
      const key = `${dto.menuItemId}:${dto.sizeId}`;
      if (seen.has(key)) {
        const err = new ValidationErrorNode(
          'orderedItems',
          id,
          'duplicate item on order',
        );
        results.push(err);
      } else {
        seen.add(key);
      }
    }

    // nested validator call
    const nestedDtoErrs = await this.orderItemValidator.validateManyNestedNode(
      'orderedItems',
      dto.orderedItemDtos,
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

    if (dto.fulfillmentType === 'delivery' && !dto.deliveryAddress) {
      const err = new ValidationErrorNode(
        'deliveryAddress',
        id,
        'Order for delivery must have a delivery address',
      );
      results.push(err);
    }

    if (dto.isWeekly && !dto.weeklyFulfillment) {
      const err = new ValidationErrorNode(
        'weeklyFulfillment',
        id,
        'Order must have a day of the week selected for fulfillment',
      );
      results.push(err);
    }

    // check for duplicate ordered items (menuItem / Size combinations)
    // DOESNT HANDLE CONTAINERS
    // False negative with 2 boxes of cookies with different contents
    const itemMap = new Map<string | number, string>();
    const seen = new Set<string>();
    if (dto.orderedItemDtos && dto.orderedItemDtos.length) {
      const currentOrder = await this.repo.findOne({
        where: { id },
        relations: [
          'orderedItems',
          'orderedItems.menuItem',
          'orderedItems.size',
        ],
      });
      if (!currentOrder) {
        throw new Error(
          `update order validator: current order with id ${id} was not found`,
        );
      }
      for (const orderItem of currentOrder.orderedItems) {
        itemMap.set(
          orderItem.id,
          `${orderItem.menuItem.id}:${orderItem.size.id}`,
        );
      }
      for (const nestedDto of dto.orderedItemDtos) {
        if (nestedDto.createDto && nestedDto.createId) {
          itemMap.set(
            nestedDto.createId,
            `${nestedDto.createDto.menuItemId}:${nestedDto.createDto.sizeId}`,
          );
        } else if (nestedDto.updateDto && nestedDto.id) {
          const currentItem = itemMap.get(nestedDto.id);

          const newMenuItemId =
            nestedDto.updateDto.menuItemId ?? currentItem?.split(':')[0];
          const newMenuitemSizeId =
            nestedDto.updateDto.sizeId ?? currentItem?.split(':')[1];

          itemMap.set(nestedDto.id, `${newMenuItemId}:${newMenuitemSizeId}`);
        }
      }
      for (const val of itemMap.values()) {
        if (seen.has(val)) {
          const err = new ValidationErrorNode(
            'orderedItems',
            id,
            'duplicate item on order',
          );
          results.push(err);
        } else {
          seen.add(val);
        }
      }
    }

    if (dto.orderedItemDtos && dto.orderedItemDtos.length) {
      // nested validator
      const nestedDtoErrs =
        await this.orderItemValidator.validateManyNestedNode(
          'orderedItems',
          dto.orderedItemDtos,
        );
      if (nestedDtoErrs) {
        results.push(nestedDtoErrs);
      }
    }

    return this.checkValidateResult(results);
  }
}
