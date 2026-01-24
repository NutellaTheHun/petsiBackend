import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order, OrderEntity } from '../entities/order.entity';
import { OrderMenuItemComposer } from '../utils/composers/order-menu-item.composer';
import { OrderValidator } from '../validators/order.validator';

@Injectable()
export class OrderService extends ServiceBase<OrderEntity> {
  constructor(
    @InjectRepository(Order)
    repo: Repository<Order>,
    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: OrderValidator,
    private readonly orderMenuItemComposer: OrderMenuItemComposer,
  ) {
    super(repo, 'OrderService', requestContextService, logger, validator);
  }

  protected async createEntity(
    dto: CreateOrderDto,
    manager: EntityManager,
  ): Promise<Order> {
    const result = manager.create(Order, {
      orderCategory: { id: dto.categoryId },
      recipient: dto.recipient,
      fulfillmentDate: dto.fulfillmentDate,
      fulfillmentType: dto.fulfillmentType,
      fulfillmentContactName: dto.fulfillmentContactName
        ? dto.fulfillmentContactName
        : null,
      deliveryAddress: dto.deliveryAddress ? dto.deliveryAddress : null,
      phoneNumber: dto.phoneNumber ? dto.phoneNumber : null,
      email: dto.email ? dto.email : null,
      note: dto.note ? dto.note : null,
      weeklyFulfillment: dto.weeklyFulfillment ? dto.weeklyFulfillment : null,
      isFrozen: dto.isFrozen ? dto.isFrozen : false,
      isWeekly: dto.isWeekly ? dto.isWeekly : false,
    });

    const savedResult = await manager.save(result);

    if (dto.orderedItems.length) {
      savedResult.orderedItems =
        await this.orderMenuItemComposer.composeManyNestedEntity(
          dto.orderedItems,
          manager,
          [],
          {
            parentOrderId: savedResult.id,
          },
        );

      await manager.save(savedResult);
    }

    return savedResult;
  }

  protected async updateEntity(
    dto: UpdateOrderDto,
    manager: EntityManager,
    entity: Order,
  ): Promise<void> {
    if (dto.recipient !== undefined) {
      entity.recipient = dto.recipient;
    }

    if (dto.fulfillmentDate !== undefined) {
      entity.fulfillmentDate = dto.fulfillmentDate;
    }

    if (dto.fulfillmentType !== undefined) {
      entity.fulfillmentType = dto.fulfillmentType;
    }

    if (dto.fulfillmentContactName !== undefined) {
      entity.fulfillmentContactName = dto.fulfillmentContactName;
    }

    if (dto.deliveryAddress !== undefined) {
      entity.deliveryAddress = dto.deliveryAddress;
    }

    if (dto.phoneNumber !== undefined) {
      entity.phoneNumber = dto.phoneNumber;
    }

    if (dto.email !== undefined) {
      entity.email = dto.email;
    }

    if (dto.note !== undefined) {
      entity.note = dto.note;
    }

    if (dto.isFrozen !== undefined) {
      entity.isFrozen = dto.isFrozen;
    }

    if (dto.isWeekly !== undefined) {
      entity.isWeekly = dto.isWeekly;
    }

    if (dto.weeklyFulfillment !== undefined) {
      entity.weeklyFulfillment = dto.weeklyFulfillment;
    }

    if (dto.categoryId !== undefined) {
      entity.category = manager.create(OrderCategory, {
        id: dto.categoryId,
      });
    }

    if (dto.orderedItems) {
      const existingItems = await manager.find(OrderMenuItem, {
        where: { parentOrder: { id: entity.id } },
      });
      entity.orderedItems =
        await this.orderMenuItemComposer.composeManyNestedEntity(
          dto.orderedItems,
          manager,
          existingItems,
          {
            parentOrderId: entity.id,
          },
        );
    }

    await manager.save(entity);
  }

  protected applySearch(
    query: SelectQueryBuilder<Order>,
    search: string,
  ): void {
    query
      .leftJoin('entity.orderedItems', 'orderedItem')
      .leftJoin('orderedItem.menuItem', 'menuItem')
      .andWhere(
        `(LOWER(entity.recipient) LIKE :search OR LOWER(menuItem.name) LIKE :search)`,
        { search: `%${search.toLowerCase()}%` },
      );
  }

  protected applyFilters(
    query: SelectQueryBuilder<Order>,
    filters: Record<string, string[]>,
  ): void {
    if (filters.category && filters.category.length > 0) {
      query.andWhere('entity.category IN (:...categories)', {
        categories: filters.category,
      });
    }

    if (filters.isFrozen && filters.isFrozen.length > 0) {
      query.andWhere('entity.isFrozen IN (:...isFrozen)', {
        isFrozens: filters.isFrozen,
      });
    }

    if (filters.fulfillmentType && filters.fulfillmentType.length > 0) {
      query.andWhere('entity.fulfillmentType IN (:...fulfillmentType)', {
        fulfillmentType: filters.fulfillmentType,
      });
    }
  }

  protected applyDate(
    query: SelectQueryBuilder<Order>,
    startDate: string,
    endDate?: string,
    dateBy?: string,
  ): void {
    if (dateBy === 'createdAt' || dateBy === 'fulfillmentDate') {
      query.andWhere(`DATE(entity.${dateBy}) >= :startDate`, { startDate });

      if (endDate) {
        query.andWhere(`DATE(entity.${dateBy}) <= :endDate`, { endDate });
      }
    }
  }

  protected applySortBy(
    query: SelectQueryBuilder<Order>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'category') {
      query.leftJoinAndSelect('entity.category', 'category');
      query.orderBy(`category.name`, sortOrder);
    } else if (sortBy === 'recipient') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    } else if (sortBy === 'fulfillmentDate') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    } else if (sortBy === 'createdAt') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
