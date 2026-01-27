import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { NestedUpdateOrderMenuItemDto } from '../dto/order-menu-item/nested-update-order-menu-item.dto';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { OrderMenuItemBuilder } from './order-menu-item.builder';

@Injectable()
export class OrderBuilder extends BuilderBase<Order> {
  constructor(
    @InjectRepository(OrderCategory)
    private readonly categoryRepo: Repository<OrderCategory>,

    @InjectRepository(OrderMenuItem)
    private readonly orderItemRepo: Repository<OrderMenuItem>,

    @Inject(forwardRef(() => OrderMenuItemBuilder))
    private readonly itemBuilder: OrderMenuItemBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(Order, 'OrderBuilder', requestContextService, logger);
  }

  protected createEntity(dto: CreateOrderDto): void {
    if (dto.deliveryAddress !== undefined) {
      this.deliveryAddress(dto.deliveryAddress);
    }
    if (dto.email !== undefined) {
      this.email(dto.email);
    }
    if (dto.fulfillmentDate !== undefined) {
      this.fulfillmentDate(dto.fulfillmentDate);
    }
    if (dto.fulfillmentType !== undefined) {
      this.fulfillmentType(dto.fulfillmentType);
    }
    if (dto.isFrozen !== undefined) {
      this.isFrozen(dto.isFrozen);
    }
    if (dto.isWeekly !== undefined) {
      this.isWeekly(dto.isWeekly);
    }
    if (dto.note !== undefined) {
      this.note(dto.note);
    }
    if (dto.orderedItems !== undefined) {
      this.orderedItemsByBuilder(dto.orderedItems);
    }
    if (dto.categoryId !== undefined) {
      this.categoryById(dto.categoryId);
    }
    if (dto.phoneNumber !== undefined) {
      this.phoneNumber(dto.phoneNumber);
    }
    if (dto.recipient !== undefined) {
      this.recipient(dto.recipient);
    }
    if (dto.weeklyFulfillment !== undefined) {
      this.weeklyFulfillment(dto.weeklyFulfillment);
    }
    if (dto.fulfillmentContactName !== undefined) {
      this.fulfillmentContactName(dto.fulfillmentContactName);
    }
  }

  protected updateEntity(dto: UpdateOrderDto): void {
    if (dto.deliveryAddress !== undefined) {
      this.deliveryAddress(dto.deliveryAddress);
    }
    if (dto.email !== undefined) {
      this.email(dto.email);
    }
    if (dto.fulfillmentDate !== undefined) {
      this.fulfillmentDate(dto.fulfillmentDate);
    }
    if (dto.fulfillmentType !== undefined) {
      this.fulfillmentType(dto.fulfillmentType);
    }
    if (dto.isFrozen !== undefined) {
      this.isFrozen(dto.isFrozen);
    }
    if (dto.isWeekly !== undefined) {
      this.isWeekly(dto.isWeekly);
    }
    if (dto.note !== undefined) {
      this.note(dto.note);
    }
    if (dto.orderedItems !== undefined) {
      this.orderedItemsByBuilder(dto.orderedItems);
    }
    if (dto.categoryId !== undefined) {
      this.categoryById(dto.categoryId);
    }
    if (dto.phoneNumber !== undefined) {
      this.phoneNumber(dto.phoneNumber);
    }
    if (dto.recipient !== undefined) {
      this.recipient(dto.recipient);
    }
    if (dto.weeklyFulfillment !== undefined) {
      this.weeklyFulfillment(dto.weeklyFulfillment);
    }
    if (dto.fulfillmentContactName !== undefined) {
      this.fulfillmentContactName(dto.fulfillmentContactName);
    }
  }

  public categoryById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.categoryRepo.findOne({ where: { id } }),
      'category',
      id,
    );
  }

  public categoryByName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.categoryRepo.findOne({ where: { name } }),
      'category',
      name,
    );
  }

  public recipient(name: string): this {
    return this.setPropByVal('recipient', name);
  }

  public fulfillmentDate(date: Date): this {
    return this.setPropByVal('fulfillmentDate', date);
  }

  public fulfillmentType(type: string): this {
    return this.setPropByVal('fulfillmentType', type);
  }

  public deliveryAddress(address: string | null): this {
    if (address === null) {
      return this.setPropByVal('deliveryAddress', null);
    }
    return this.setPropByVal('deliveryAddress', address);
  }

  public phoneNumber(number: string | null): this {
    if (number === null) {
      return this.setPropByVal('phoneNumber', null);
    }
    return this.setPropByVal('phoneNumber', number);
  }

  public email(email: string | null): this {
    if (email === null) {
      return this.setPropByVal('email', null);
    }
    return this.setPropByVal('email', email);
  }

  public note(note: string | null): this {
    if (note === null) {
      return this.setPropByVal('note', null);
    }
    return this.setPropByVal('note', note);
  }

  public isFrozen(val: boolean): this {
    return this.setPropByVal('isFrozen', val);
  }

  public isWeekly(val: boolean): this {
    return this.setPropByVal('isWeekly', val);
  }

  public orderedItemsById(ids: number[]): this {
    return this.setPropsByIds(
      async (ids: number[]) =>
        await this.orderItemRepo.find({ where: { id: In(ids) } }),
      'orderedItems',
      ids,
    );
  }

  public orderedItemsByBuilder(
    dtos: (
      | CreateOrderMenuItemDto
      | NestedCreateOrderMenuItemDto
      | NestedUpdateOrderMenuItemDto
    )[],
  ): this {
    return this.setPropByBuilder(
      this.itemBuilder.buildMany.bind(this.itemBuilder),
      'orderedItems',
      this.entity,
      dtos,
    );
  }

  public weeklyFulfillment(day: string | null): this {
    if (day === null) {
      return this.setPropByVal('weeklyFulfillment', null);
    }
    return this.setPropByVal('weeklyFulfillment', day);
  }

  public fulfillmentContactName(name: string | null): this {
    if (name === null) {
      return this.setPropByVal('fulfillmentContactName', null);
    }
    return this.setPropByVal('fulfillmentContactName', name);
  }
}
