import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItemSizeService } from '../../menu-items/services/menu-item-size.service';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { NestedCreateOrderContainerItemDto } from '../dto/order-container-item/nested-create-order-container-item.dto';
import { NestedUpdateOrderContainerItemDto } from '../dto/order-container-item/nested-update-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { OrderContainerItemService } from '../services/order-container-item.service';
import { OrderMenuItemService } from '../services/order-menu-item.service';

@Injectable()
export class OrderContainerItemBuilder extends BuilderBase<OrderContainerItem> {
  constructor(
    @Inject(forwardRef(() => OrderContainerItemService))
    private readonly componentService: OrderContainerItemService,

    @Inject(forwardRef(() => OrderMenuItemService))
    private readonly orderItemService: OrderMenuItemService,

    private readonly menuItemService: MenuItemService,
    private readonly sizeService: MenuItemSizeService,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      OrderContainerItem,
      'OrderContainerItemBuilder',
      requestContextService,
      logger,
    );
  }

  protected createEntity(
    dto: CreateOrderContainerItemDto,
    parent?: OrderMenuItem,
  ): void {
    if (dto.containedItemSizeId !== undefined) {
      this.containedItemSizeById(dto.containedItemSizeId);
    }
    if (dto.containedMenuItemId !== undefined) {
      this.containedMenuItemById(dto.containedMenuItemId);
    }

    // If the parentOrderMenuItemId is provided, use it to set the parentOrderItem. (Through order-menu-item endpoint)
    // If the parentOrderMenuItemId is not provided, but a parent is provided, use the parent to set the parentOrderItem. (Through create order-menu-item endpoint)
    if (parent) {
      this.setPropByVal('parentOrderMenuItem', parent);
    } else if (dto.parentOrderMenuItemId !== undefined) {
      this.parentOrderMenuItemById(dto.parentOrderMenuItemId);
    }

    if (dto.quantity !== undefined) {
      this.quantity(dto.quantity);
    }
  }

  protected updateEntity(dto: UpdateOrderContainerItemDto): void {
    if (dto.containedItemSizeId !== undefined) {
      this.containedItemSizeById(dto.containedItemSizeId);
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
    dtos: (
      | CreateOrderContainerItemDto
      | NestedCreateOrderContainerItemDto
      | NestedUpdateOrderContainerItemDto
    )[],
  ): Promise<OrderContainerItem[]> {
    const results: OrderContainerItem[] = [];
    for (const dto of dtos) {
      if (dto instanceof CreateOrderContainerItemDto) {
        results.push(await this.buildCreateDto(dto));
      } else {
        if ('createId' in dto) {
          results.push(await this.buildCreateDto(dto, parent, dto.createId));
        }
        if ('id' in dto) {
          const item = await this.componentService.findOne(dto.id);
          if (!item) {
            throw new Error('order container item not found');
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
      'containedMenuItem',
      id,
    );
  }

  private quantity(amount: number): this {
    return this.setPropByVal('quantity', amount);
  }

  private parentOrderMenuItemById(id: number): this {
    return this.setPropById(
      this.orderItemService.findOne.bind(this.orderItemService),
      'parentOrderMenuItem',
      id,
    );
  }
}
