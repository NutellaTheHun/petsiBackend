import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
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
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      results,
      'Inventory category name already exists',
      id,
    );

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryItemCategoryDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Already exists check
    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        results,
        'Inventory category name already exists',
        id,
      );
    }

    return this.checkValidateResult(results);
  }
}
