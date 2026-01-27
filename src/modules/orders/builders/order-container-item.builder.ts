import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { NestedCreateOrderContainerItemDto } from '../dto/order-container-item/nested-create-order-container-item.dto';
import { NestedUpdateOrderContainerItemDto } from '../dto/order-container-item/nested-update-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';

@Injectable()
export class OrderContainerItemBuilder extends BuilderBase<OrderContainerItem> {
  constructor(
    @InjectRepository(OrderContainerItem)
    private readonly containerItemRepo: Repository<OrderContainerItem>,
    @InjectRepository(OrderMenuItem)
    private readonly orderItemRepo: Repository<OrderMenuItem>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,
    @InjectRepository(MenuItemSize)
    private readonly sizeRepo: Repository<MenuItemSize>,

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
          const item = await this.containerItemRepo.findOne({
            where: { id: dto.id },
          });
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
      async (id: number) => await this.sizeRepo.findOne({ where: { id } }),
      'containedItemSize',
      id,
    );
  }

  private containedMenuItemById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.menuItemRepo.findOne({ where: { id } }),
      'containedMenuItem',
      id,
    );
  }

  private quantity(amount: number): this {
    return this.setPropByVal('quantity', amount);
  }

  private parentOrderMenuItemById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.orderItemRepo.findOne({ where: { id } }),
      'parentOrderMenuItem',
      id,
    );
  }
}
