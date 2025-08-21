import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../base/builder-base';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItemSizeService } from '../../menu-items/services/menu-item-size.service';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { NestedOrderContainerItemDto } from '../dto/order-container-item/nested-order-container-item.dto';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { NestedOrderMenuItemDto } from '../dto/order-menu-item/nested-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../dto/order-menu-item/update-order-menu-item.dto';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { OrderMenuItemService } from '../services/order-menu-item.service';
import { OrderService } from '../services/order.service';
import { OrderMenuItemValidator } from '../validators/order-menu-item.validator';
import { OrderContainerItemBuilder } from './order-container-item.builder';

@Injectable()
export class OrderMenuItemBuilder extends BuilderBase<OrderMenuItem> {
  constructor(
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,

    @Inject(forwardRef(() => OrderMenuItemService))
    private readonly orderItemService: OrderMenuItemService,

    @Inject(forwardRef(() => OrderContainerItemBuilder))
    private readonly containerItemBuilder: OrderContainerItemBuilder,

    private readonly menuItemService: MenuItemService,
    private readonly sizeService: MenuItemSizeService,

    validator: OrderMenuItemValidator,
    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      OrderMenuItem,
      'OrderMenuItemBuilder',
      requestContextService,
      logger,
      validator,
    );
  }

  protected createEntity(dto: CreateOrderMenuItemDto, parent?: Order): void {
    if (dto.menuItemId !== undefined) {
      this.menuItemById(dto.menuItemId);
    }
    if (dto.menuItemSizeId !== undefined) {
      this.menuItemSizeById(dto.menuItemSizeId);
    }

    // If the orderId is provided, use it to set the order. (Through order-menu-item endpoint)
    // If the orderId is not provided, but a parent is provided, use the parent to set the order. (Through create order endpoint)
    if (parent) {
      this.setPropByVal('order', parent);
    } else if (dto.orderId !== undefined) {
      this.orderById(dto.orderId);
    }

    if (dto.quantity !== undefined) {
      this.quantity(dto.quantity);
    }
    if (dto.orderedItemContainerDtos !== undefined) {
      this.containerItemsByBuilder(dto.orderedItemContainerDtos);
    }
  }

  protected updateEntity(dto: UpdateOrderMenuItemDto): void {
    if (dto.menuItemId !== undefined) {
      this.menuItemById(dto.menuItemId);
    }
    if (dto.menuItemSizeId !== undefined) {
      this.menuItemSizeById(dto.menuItemSizeId);
    }
    if (dto.quantity !== undefined) {
      this.quantity(dto.quantity);
    }
    if (dto.orderedItemContainerDtos !== undefined) {
      this.containerItemsByBuilder(dto.orderedItemContainerDtos);
    }
  }

  public async buildMany(
    dtos: (CreateOrderMenuItemDto | NestedOrderMenuItemDto)[],
  ): Promise<OrderMenuItem[]> {
    const results: OrderMenuItem[] = [];
    for (const dto of dtos) {
      if (dto instanceof CreateOrderMenuItemDto) {
        results.push(await this.buildCreateDto(dto));
      } else {
        if (dto.createDto) {
          results.push(await this.buildCreateDto(dto.createDto, parent));
        }
        if (dto.updateDto && dto.id) {
          const item = await this.orderItemService.findOne(dto.id);
          if (!item) {
            throw new Error('orderMenuItem not found');
          }
          results.push(await this.buildUpdateDto(item, dto.updateDto));
        }
      }
    }
    return results;
  }

  public orderById(id: number): this {
    return this.setPropById(
      this.orderService.findOne.bind(this.orderService),
      'order',
      id,
    );
  }

  public menuItemById(id: number): this {
    return this.setPropById(
      this.menuItemService.findOne.bind(this.menuItemService),
      'menuItem',
      id,
    );
  }

  public menuItemByName(name: string): this {
    return this.setPropByName(
      this.menuItemService.findOneByName.bind(this.menuItemService),
      'menuItem',
      name,
    );
  }

  public menuItemSizeById(id: number): this {
    return this.setPropById(
      this.sizeService.findOne.bind(this.sizeService),
      'size',
      id,
    );
  }

  public menuItemSizeByName(name: string): this {
    return this.setPropByName(
      this.sizeService.findOneByName.bind(this.sizeService),
      'size',
      name,
    );
  }

  public quantity(amount: number): this {
    return this.setPropByVal('quantity', amount);
  }

  public containerItemsByBuilder(
    dtos: (CreateOrderContainerItemDto | NestedOrderContainerItemDto)[],
  ): this {
    return this.setPropByBuilder(
      this.containerItemBuilder.buildMany.bind(this.containerItemBuilder),
      'orderedContainerItems',
      this.entity,
      dtos,
    );
  }
}
