import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
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
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // Already exists check
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      errorMap,
      'Inventory category name already exists',
    );

    return errorMap;
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryItemCategoryDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // Already exists check
    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        errorMap,
        'Inventory category name already exists',
      );
    }

    return errorMap;
  }
}
