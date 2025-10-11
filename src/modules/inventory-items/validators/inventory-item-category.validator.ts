import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/update-inventory-item-category.dto';
import {
  InventoryItemCategory,
  InventoryItemCategoryEntity,
} from '../entities/inventory-item-category.entity';

@Injectable()
export class InventoryItemCategoryValidator extends ValidatorBase<InventoryItemCategoryEntity> {
  constructor(
    @InjectRepository(InventoryItemCategory)
    private readonly repo: Repository<InventoryItemCategory>,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'InventoryItemCategory', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateInventoryItemCategoryDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Already exists check
    if (
      await this.helper.exists(this.repo, 'categoryName', dto.itemCategoryName)
    ) {
      const err = new ValidationErrorNode(
        'categoryName',
        id,
        'Inventory category name already exists',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryItemCategoryDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Already exists check
    if (dto.itemCategoryName) {
      if (
        await this.helper.exists(
          this.repo,
          'categoryName',
          dto.itemCategoryName,
        )
      ) {
        const err = new ValidationErrorNode(
          'categoryName',
          id,
          'Inventory category name already exists',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }
}
