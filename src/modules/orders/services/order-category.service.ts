import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { OrderCategoryBuilder } from '../builders/order-category.builder';
import { CreateOrderCategoryDto } from '../dto/order-category/create-order-category.dto';
import { UpdateOrderCategoryDto } from '../dto/order-category/update-order-category.dto';
import {
  OrderCategory,
  OrderCategoryEntity,
} from '../entities/order-category.entity';
import { OrderCategoryValidator } from '../validators/order-category.validator';

@Injectable()
export class OrderCategoryService extends ServiceBase<OrderCategoryEntity> {
  constructor(
    @InjectRepository(OrderCategory)
    private readonly repo: Repository<OrderCategory>,

    builder: OrderCategoryBuilder,
    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: OrderCategoryValidator,
  ) {
    super(
      repo,
      builder,
      'OrderCategoryService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateOrderCategoryDto,
    manager: EntityManager,
  ): Promise<OrderCategory> {
    const result = manager.create(OrderCategory, {
      name: dto.name,
    });
    return await manager.save(result);
  }

  protected async updateEntity(
    dto: UpdateOrderCategoryDto,
    manager: EntityManager,
    entity: OrderCategory,
  ): Promise<void> {
    if (dto.name !== undefined) {
      entity.name = dto.name;
    }
    await manager.save(entity);
  }

  async findOneByName(
    name: string,
    relations?: Array<keyof OrderCategory>,
  ): Promise<OrderCategory | null> {
    return this.repo.findOne({ where: { name: name }, relations });
  }

  protected applySortBy(
    query: SelectQueryBuilder<OrderCategory>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'name') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
