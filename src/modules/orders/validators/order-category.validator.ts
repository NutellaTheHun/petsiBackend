import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderCategoryDto } from '../dto/order-category/create-order-category.dto';
import { UpdateOrderCategoryDto } from '../dto/order-category/update-order-category.dto';
import {
  OrderCategory,
  OrderCategoryEntity,
} from '../entities/order-category.entity';

@Injectable()
export class OrderCategoryValidator extends ValidatorBase<OrderCategoryEntity> {
  constructor(
    @InjectRepository(OrderCategory)
    private readonly repo: Repository<OrderCategory>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'OrderCategory', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateOrderCategoryDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // name exists
    if (await this.helper.exists(this.repo, 'categoryName', dto.name)) {
      const err = new ValidationErrorNode(
        'categoryName',
        id,
        'Order category with that name already exists.',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateOrderCategoryDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // name exists
    if (dto.name) {
      const err = new ValidationErrorNode(
        'categoryName',
        id,
        'Order category with that name already exists.',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }
}
