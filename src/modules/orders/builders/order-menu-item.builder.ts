import { forwardRef, Inject, Injectable } from '@nestjs/common';
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
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { NestedUpdateOrderMenuItemDto } from '../dto/order-menu-item/nested-update-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../dto/order-menu-item/update-order-menu-item.dto';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { OrderContainerItemBuilder } from './order-container-item.builder';

@Injectable()
export class OrderMenuItemBuilder extends BuilderBase<OrderMenuItem> {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(OrderMenuItem)
    private readonly orderItemRepo: Repository<OrderMenuItem>,

    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,

    @InjectRepository(MenuItemSize)
    private readonly sizeRepo: Repository<MenuItemSize>,

    @Inject(forwardRef(() => OrderContainerItemBuilder))
    private readonly containerItemBuilder: OrderContainerItemBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(OrderMenuItem, 'OrderMenuItemBuilder', requestContextService, logger);
  }

  protected createEntity(dto: CreateOrderMenuItemDto, parent?: Order): void {
    if (dto.menuItemId !== undefined) {
      this.menuItemById(dto.menuItemId);
    }
    if (dto.sizeId !== undefined) {
      this.menuItemSizeById(dto.sizeId);
    }

    // If the orderId is provided, use it to set the order. (Through order-menu-item endpoint)
    // If the orderId is not provided, but a parent is provided, use the parent to set the order. (Through create order endpoint)
    if (parent) {
      this.setPropByVal('parentOrder', parent);
    } else if (dto.parentOrderId !== undefined) {
      this.orderById(dto.parentOrderId);
    }

    if (dto.quantity !== undefined) {
      this.quantity(dto.quantity);
    }
    if (dto.containerOrderMenuItems !== undefined) {
      this.containerItemsByBuilder(dto.containerOrderMenuItems);
    }
  }

  protected updateEntity(dto: UpdateOrderMenuItemDto): void {
    if (dto.menuItemId !== undefined) {
      this.menuItemById(dto.menuItemId);
    }
    if (dto.sizeId !== undefined) {
      this.menuItemSizeById(dto.sizeId);
    }
    if (dto.quantity !== undefined) {
      this.quantity(dto.quantity);
    }
    if (dto.containerOrderMenuItems !== undefined) {
      this.containerItemsByBuilder(dto.containerOrderMenuItems);
    }
  }

  public async buildMany(
    parent: Order,
    dtos: (
      | CreateOrderMenuItemDto
      | NestedCreateOrderMenuItemDto
      | NestedUpdateOrderMenuItemDto
    )[],
  ): Promise<OrderMenuItem[]> {
    const results: OrderMenuItem[] = [];
    for (const dto of dtos) {
      if (dto instanceof CreateOrderMenuItemDto) {
        results.push(await this.buildCreateDto(dto));
      } else {
        if ('createId' in dto) {
          results.push(await this.buildCreateDto(dto, parent, dto.createId));
        }
        if ('id' in dto) {
          const item = await this.orderItemRepo.findOne({
            where: { id: dto.id },
          });
          if (!item) {
            throw new Error('orderMenuItem not found');
          }
          results.push(await this.buildUpdateDto(item, dto));
        }
      }
    }
    return results;
  }

  public orderById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.orderRepo.findOne({ where: { id } }),
      'parentOrder',
      id,
    );
  }

  public menuItemById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.menuItemRepo.findOne({ where: { id } }),
      'menuItem',
      id,
    );
  }

  public menuItemByName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.menuItemRepo.findOne({ where: { name } }),
      'menuItem',
      name,
    );
  }

  public menuItemSizeById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.sizeRepo.findOne({ where: { id } }),
      'size',
      id,
    );
  }

  public menuItemSizeByName(name: string): this {
    return this.setPropByName(
      async (name: string) => await this.sizeRepo.findOne({ where: { name } }),
      'size',
      name,
    );
  }

  public quantity(amount: number): this {
    return this.setPropByVal('quantity', amount);
  }

  public containerItemsByBuilder(
    dtos: (
      | CreateOrderContainerItemDto
      | NestedCreateOrderContainerItemDto
      | NestedUpdateOrderContainerItemDto
    )[],
  ): this {
    return this.setPropByBuilder(
      this.containerItemBuilder.buildMany.bind(this.containerItemBuilder),
      'containerOrderMenuItems',
      this.entity,
      dtos,
    );
  }
}
