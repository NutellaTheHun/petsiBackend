import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { OrderBuilder } from '../builders/order.builder';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order, OrderEntity } from '../entities/order.entity';
import { OrderMenuItemCreateInTransaction } from '../utils/transactions/order-menu-item.create.transaction';
import { OrderMenuItemUpdateInTransaction } from '../utils/transactions/order-menu-item.update.transaction';
import { OrderValidator } from '../validators/order.validator';

@Injectable()
export class OrderService extends ServiceBase<OrderEntity> {
  constructor(
    @InjectRepository(Order)
    repo: Repository<Order>,

    @Inject(forwardRef(() => OrderBuilder))
    builder: OrderBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: OrderValidator,
  ) {
    super(
      repo,
      builder,
      'OrderService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateOrderDto,
    manager: EntityManager,
  ): Promise<Order> {
    let orderedItems: OrderMenuItem[] = [];
    if (dto.orderedMenuItemDtos) {
      for (const nestedDto of dto.orderedMenuItemDtos) {
        if (nestedDto.createDto) {
          const newItem = await OrderMenuItemCreateInTransaction(
            nestedDto.createDto,
            manager,
          );
          orderedItems.push(newItem);
        } else {
          throw new Error(
            'Create Order: nested OrderMenuItem has null create dto',
          );
        }
      }
    }

    const result = manager.create(Order, {
      orderCategory: { id: dto.orderCategoryId },
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
      orderedItems,

      isFrozen: dto.isFrozen ? dto.isFrozen : false,
      isWeekly: dto.isWeekly ? dto.isWeekly : false,
    });
    return result;
  }

  protected async updateEntity(
    dto: UpdateOrderDto,
    manager: EntityManager,
    entity: Order,
  ): Promise<void> {
    if (dto.deliveryAddress !== undefined) {
      entity.deliveryAddress = dto.deliveryAddress;
    }

    if (dto.email !== undefined) {
      entity.email = dto.email;
    }

    if (dto.fulfillmentContactName !== undefined) {
      entity.fulfillmentContactName = dto.fulfillmentContactName;
    }

    if (dto.fulfillmentDate !== undefined) {
      entity.fulfillmentDate = dto.fulfillmentDate;
    }

    if (dto.fulfillmentType !== undefined) {
      entity.fulfillmentType = dto.fulfillmentType;
    }

    if (dto.isFrozen !== undefined) {
      entity.isFrozen = dto.isFrozen;
    }

    if (dto.isWeekly !== undefined) {
      entity.isWeekly = dto.isWeekly;
    }

    if (dto.note !== undefined) {
      entity.note = dto.note;
    }

    if (dto.orderCategoryId !== undefined) {
      entity.orderCategory = manager.create(OrderCategory, {
        id: dto.orderCategoryId,
      });
    }

    if (dto.phoneNumber !== undefined) {
      entity.phoneNumber = dto.phoneNumber;
    }

    if (dto.recipient !== undefined) {
      entity.recipient = dto.recipient;
    }

    if (dto.weeklyFulfillment !== undefined) {
      entity.weeklyFulfillment = dto.weeklyFulfillment;
    }

    if (dto.orderedMenuItemDtos) {
      const existingItems = await manager.find(OrderMenuItem, {
        where: { order: { id: entity.id } },
      });
      const existingMap = new Map(existingItems.map((i) => [i.id, i]));

      for (const nestedDto of dto.orderedMenuItemDtos) {
        if (nestedDto.createDto) {
          const newItem = await OrderMenuItemCreateInTransaction(
            nestedDto.createDto,
            manager,
          );
          existingMap.set(newItem.id, newItem);
        } else if (nestedDto.updateDto && nestedDto.id) {
          const toUpdate = existingMap.get(nestedDto.id);
          if (!toUpdate) {
            throw new Error(
              `Update Order: nested OrderMenuItem with id ${nestedDto.id} was not found in existing items`,
            );
          }
          await OrderMenuItemUpdateInTransaction(
            nestedDto.updateDto,
            manager,
            toUpdate,
          );
        } else {
          throw new Error(
            'Update Order: nested OrderMenuItem dto has neither createDto or updateDto with id',
          );
        }
      }
      entity.orderedItems = Array.from(existingMap.values());
    }
  }

  protected applySearch(
    query: SelectQueryBuilder<Order>,
    search: string,
  ): void {
    query
      .leftJoin('entity.orderedItems', 'orderedItem')
      .leftJoin('orderedItem.menuItem', 'menuItem')
      .andWhere(
        `(LOWER(entity.recipient) LIKE :search OR LOWER(menuItem.itemName) LIKE :search)`,
        { search: `%${search.toLowerCase()}%` },
      );
  }

  protected applyFilters(
    query: SelectQueryBuilder<Order>,
    filters: Record<string, string[]>,
  ): void {
    if (filters.category && filters.category.length > 0) {
      query.andWhere('entity.orderCategory IN (:...categories)', {
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
    if (sortBy === 'orderCategory') {
      query.leftJoinAndSelect('entity.orderCategory', 'category');
      query.orderBy(`category.categoryName`, sortOrder);
    } else if (sortBy === 'recipient') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    } else if (sortBy === 'fulfillmentDate') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    } else if (sortBy === 'createdAt') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
    /**
          - orderCategory name \n
      - recipient \n
      - fulfillmentDate \n
      - createdAt`,
        */
  }
}
