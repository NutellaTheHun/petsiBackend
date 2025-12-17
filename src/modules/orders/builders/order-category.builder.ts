import { Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../base/builder-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderCategoryDto } from '../dto/order-category/create-order-category.dto';
import { UpdateOrderCategoryDto } from '../dto/order-category/update-order-category.dto';
import { OrderCategory } from '../entities/order-category.entity';

@Injectable()
export class OrderCategoryBuilder extends BuilderBase<OrderCategory> {
  constructor(requestContextService: RequestContextService, logger: AppLogger) {
    super(OrderCategory, 'OrderCategoryBuilder', requestContextService, logger);
  }

  protected createEntity(dto: CreateOrderCategoryDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
  }

  protected updateEntity(dto: UpdateOrderCategoryDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
  }

  public name(name: string): this {
    return this.setPropByVal('categoryName', name);
  }
}
