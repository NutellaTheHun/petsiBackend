import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItemSizeService } from '../../menu-items/services/menu-item-size.service';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../dto/order-menu-item/update-order-menu-item.dto';
import {
  OrderMenuItem,
  OrderMenuItemEntity,
} from '../entities/order-menu-item.entity';
import { OrderContainerItemService } from '../services/order-container-item.service';
import { OrderMenuItemService } from '../services/order-menu-item.service';

@Injectable()
export class OrderMenuItemValidator extends ValidatorBase<OrderMenuItemEntity> {
  constructor(
    @InjectRepository(OrderMenuItem)
    private readonly repo: Repository<OrderMenuItem>,

    @Inject(forwardRef(() => OrderMenuItemService))
    private readonly orderItemService: OrderMenuItemService,

    @Inject(forwardRef(() => OrderContainerItemService))
    private readonly containerItemService: OrderContainerItemService,

    private readonly menuItemService: MenuItemService,
    private readonly sizeService: MenuItemSizeService,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'OrderMenuItem', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateOrderMenuItemDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    const menuItem = await this.menuItemService.findOne(dto.menuItemId, [
      'validSizes',
    ]);
    if (!menuItem.validSizes) {
      throw new Error();
    }

    // validate item / size
    if (!this.helper.isValidSize(dto.menuItemSizeId, menuItem.validSizes)) {
      const err = new ValidationErrorNode(
        'size',
        undefined,
        'Invalid item size.',
      );
      results.push(err);
    }

    if (
      dto.orderedItemContainerDtos &&
      dto.orderedItemContainerDtos.length > 0
    ) {
      const nestedCreates = dto.orderedItemContainerDtos
        .map((nested) => nested.createDto)
        .filter((nested) => nested !== undefined);
      // validate container item / size
      const duplicateItems = this.helper.findDuplicates(
        nestedCreates,
        (item) => `${item.containedMenuItemId}:${item.containedMenuItemSizeId}`,
      );
      if (duplicateItems) {
        for (const duplicate of duplicateItems) {
          const err = new ValidationErrorNode(
            'orderedContainerItems',
            undefined, // NESTED ID NEEDED
            'Order has duplicate items.',
          );
          results.push(err);
        }
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateOrderMenuItemDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // validate item / size
    if (id && (dto.menuItemId || dto.menuItemSizeId)) {
      const currentOrderItem = await this.orderItemService.findOne(id, [
        'size',
        'menuItem',
      ]);

      const sizeId = dto.menuItemSizeId ?? currentOrderItem.size.id;
      const itemId = dto.menuItemId ?? currentOrderItem.menuItem.id;

      const menuItem = await this.menuItemService.findOne(itemId, [
        'validSizes',
      ]);
      if (!menuItem) {
        throw new Error();
      }

      if (!this.helper.isValidSize(sizeId, menuItem.validSizes)) {
        const err = new ValidationErrorNode(
          'size',
          undefined,
          'Invalid item size.',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }
}
