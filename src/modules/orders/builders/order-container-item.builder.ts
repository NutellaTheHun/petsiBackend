import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../base/builder-base';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItemSizeService } from '../../menu-items/services/menu-item-size.service';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { NestedOrderContainerItemDto } from '../dto/order-container-item/nested-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { OrderContainerItemService } from '../services/order-container-item.service';
import { OrderMenuItemService } from '../services/order-menu-item.service';
import { OrderContainerItemValidator } from '../validators/order-container-item.validator';

@Injectable()
export class OrderContainerItemBuilder extends BuilderBase<OrderContainerItem> {
  constructor(
    @Inject(forwardRef(() => OrderContainerItemService))
    private readonly componentService: OrderContainerItemService,

    @Inject(forwardRef(() => OrderMenuItemService))
    private readonly orderItemService: OrderMenuItemService,

    private readonly menuItemService: MenuItemService,
    private readonly sizeService: MenuItemSizeService,

    validator: OrderContainerItemValidator,
    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      OrderContainerItem,
      'OrderContainerItemBuilder',
      requestContextService,
      logger,
      validator,
    );
  }

  protected createEntity(
    dto: CreateOrderContainerItemDto,
    parent?: OrderMenuItem,
  ): void {
    if (dto.containedMenuItemSizeId !== undefined) {
      this.containedItemSizeById(dto.containedMenuItemSizeId);
    }
    if (dto.containedMenuItemId !== undefined) {
      this.containedMenuItemById(dto.containedMenuItemId);
    }

    // If the parentOrderMenuItemId is provided, use it to set the parentOrderItem. (Through order-menu-item endpoint)
    // If the parentOrderMenuItemId is not provided, but a parent is provided, use the parent to set the parentOrderItem. (Through create order-menu-item endpoint)
    if (parent) {
      this.setPropByVal('parentOrderItem', parent);
    } else if (dto.parentOrderMenuItemId !== undefined) {
      this.parentOrderMenuItemById(dto.parentOrderMenuItemId);
    }

    if (dto.quantity !== undefined) {
      this.quantity(dto.quantity);
    }
  }

  protected updateEntity(dto: UpdateOrderContainerItemDto): void {
    if (dto.containedMenuItemSizeId !== undefined) {
      this.containedItemSizeById(dto.containedMenuItemSizeId);
    }
    if (dto.containedMenuItemId !== undefined) {
      this.containedMenuItemById(dto.containedMenuItemId);
    }
    if (dto.quantity !== undefined) {
      this.quantity(dto.quantity);
    }
  }

  async buildMany(
    parent: OrderMenuItem,
    dtos: (CreateOrderContainerItemDto | NestedOrderContainerItemDto)[],
  ): Promise<OrderContainerItem[]> {
    const results: OrderContainerItem[] = [];
    for (const dto of dtos) {
      if (dto instanceof CreateOrderContainerItemDto) {
        results.push(await this.buildCreateDto(dto));
      } else {
        if (dto.create) {
          results.push(await this.buildCreateDto(dto.create, parent));
        }
        if (dto.update) {
          const item = await this.componentService.findOne(dto.update.id);
          if (!item) {
            throw new Error('order menu item container is null');
          }
          results.push(await this.buildUpdateDto(item, dto));
        }
      }
    }
    return results;
  }

  private containedItemSizeById(id: number): this {
    return this.setPropById(
      this.sizeService.findOne.bind(this.sizeService),
      'containedItemSize',
      id,
    );
  }

  private containedMenuItemById(id: number): this {
    return this.setPropById(
      this.menuItemService.findOne.bind(this.menuItemService),
      'containedItem',
      id,
    );
  }

  private quantity(amount: number): this {
    return this.setPropByVal('quantity', amount);
  }

  private parentOrderMenuItemById(id: number): this {
    return this.setPropById(
      this.orderItemService.findOne.bind(this.orderItemService),
      'parentOrderItem',
      id,
    );
  }
}
