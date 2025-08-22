import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationError } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { Order } from '../entities/order.entity';
import { OrderMenuItemService } from '../services/order-menu-item.service';

@Injectable()
export class OrderValidator extends ValidatorBase<Order> {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,

    @Inject(forwardRef(() => OrderMenuItemService))
    private readonly itemService: OrderMenuItemService,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'Order', requestContextService, logger);
  }

  public async validateCreate(dto: CreateOrderDto): Promise<void> {
    if (dto.orderedMenuItemDtos.length === 0) {
      this.addError({
        errorMessage: 'Order has no items',
        errorType: 'INVALID',
        contextEntity: 'CreateOrderDto',
      } as ValidationError);
    }

    const nestedCreates = dto.orderedMenuItemDtos
      .map((nested) => nested.createDto)
      .filter((nested) => nested !== undefined);
    // Validate no duplicate OrderMenuItems
    const duplicateItems = this.helper.findDuplicates(
      nestedCreates,
      (item) => `${item.menuItemId}:${item.menuItemSizeId}`,
    );
    if (duplicateItems) {
      for (const duplicate of duplicateItems) {
        this.addError({
          errorMessage: 'duplicate ordered item',
          errorType: 'DUPLICATE',
          contextEntity: 'CreateOrderDto',
          sourceEntity: 'OrderMenuItem',
          sourceId: duplicate.menuItemId,
          conflictEntity: 'MenuItemSize',
          conflictId: duplicate.menuItemSizeId,
        } as ValidationError);
      }
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
      this.addError({
        errorMessage: `Invalid weeklyFulfillment value`,
        errorType: 'INVALID',
        contextEntity: 'CreateOrderDto',
        conflictEntity: 'Order',
        value: dto.weeklyFulfillment,
      } as ValidationError);
    }

    //valid fulfillment type value
    const validFulfillmentType = ['pickup', 'delivery'];
    if (!validFulfillmentType.includes(dto.fulfillmentType)) {
      this.addError({
        errorMessage: `Invalid fulfillmentType value`,
        errorType: 'INVALID',
        contextEntity: 'CreateOrderDto',
        conflictEntity: 'Order',
        value: dto.fulfillmentType,
      } as ValidationError);
    }
    this.throwIfErrors();
  }

  public async validateUpdate(id: number, dto: UpdateOrderDto): Promise<void> {
    if (dto.orderedMenuItemDtos && dto.orderedMenuItemDtos.length === 0) {
      this.addError({
        errorMessage: 'Order has no items',
        errorType: 'INVALID',
        contextEntity: 'UpdateOrderDto',
        contextId: id,
      } as ValidationError);
    }

    // Validate ordered items
    if (dto.orderedMenuItemDtos && dto.orderedMenuItemDtos.length > 0) {
      // resolve
      const resolvedDtos: { menuItemId: number; menuItemSizeId: number }[] = [];
      const updateIds: number[] = [];
      for (const d of dto.orderedMenuItemDtos) {
        if (d.createDto) {
          resolvedDtos.push({
            menuItemId: d.createDto.menuItemId,
            menuItemSizeId: d.createDto.menuItemSizeId,
          });
        }

        if (d.updateDto && d.id) {
          const currentItem = await this.itemService.findOne(d.id, [
            'menuItem',
            'size',
          ]);

          resolvedDtos.push({
            menuItemId: d.updateDto.menuItemId ?? currentItem.menuItem.id,
            menuItemSizeId: d.updateDto.menuItemSizeId ?? currentItem.size.id,
          });

          updateIds.push(d.id);
        }
      }

      // Check resolved dtos for duplicate
      const duplicateItems = this.helper.findDuplicates(
        resolvedDtos,
        (item) => `${item.menuItemId}:${item.menuItemSizeId}`,
      );
      if (duplicateItems) {
        for (const duplicate of duplicateItems) {
          this.addError({
            errorMessage: 'duplicate ordered item',
            errorType: 'DUPLICATE',
            contextEntity: 'UpdateOrderDto',
            contextId: id,
            sourceEntity: 'OrderMenuItem',
            sourceId: duplicate.menuItemId,
            conflictEntity: 'MenuItemSize',
            conflictId: duplicate.menuItemSizeId,
          } as ValidationError);
        }
      }

      //Check duplicate updates
      const duplicateIds = this.helper.findDuplicates(
        updateIds,
        (updateId) => `${updateId}`,
      );
      if (duplicateIds) {
        for (const updateId of duplicateIds) {
          this.addError({
            errorMessage: 'multiple update requests for the same ordered item',
            errorType: 'INVALID',
            contextEntity: 'UpdateOrderDto',
            contextId: id,
            sourceEntity: 'OrderMenuItem',
            sourceId: updateId,
          } as ValidationError);
        }
      }
    }

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
      this.addError({
        errorMessage: `Invalid weeklyFulfillment value`,
        errorType: 'INVALID',
        contextEntity: 'CreateOrderDto',
        contextId: id,
        conflictEntity: 'Order',
        value: dto.weeklyFulfillment,
      } as ValidationError);
    }

    // validate fulfillmentType
    const validFulfillmentType = ['pickup', 'delivery'];
    if (
      dto.fulfillmentType &&
      !validFulfillmentType.includes(dto.fulfillmentType)
    ) {
      this.addError({
        errorMessage: `Invalid fulfillmentType value`,
        errorType: 'INVALID',
        contextEntity: 'CreateOrderDto',
        contextId: id,
        conflictEntity: 'Order',
        value: dto.fulfillmentType,
      } as ValidationError);
    }

    this.throwIfErrors();
  }
}
