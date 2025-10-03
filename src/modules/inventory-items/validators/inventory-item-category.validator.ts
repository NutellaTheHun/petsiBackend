import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
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

  public async validateCreate(
    createId: string,
    dto: CreateInventoryItemCategoryDto,
  ): Promise<void> {
    // Already exists check
    if (
      await this.helper.exists(this.repo, 'categoryName', dto.itemCategoryName)
    ) {
      this.addError(
        this.buildValidationError(
          'categoryName',
          'Inventory category name already exists',
          'EXIST',
          undefined,
          createId,
        ),
      );
    }

    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    dto: UpdateInventoryItemCategoryDto,
  ): Promise<void> {
    // Already exists check
    if (dto.itemCategoryName) {
      if (
        await this.helper.exists(
          this.repo,
          'categoryName',
          dto.itemCategoryName,
        )
      ) {
        this.addError(
          this.buildValidationError(
            'categoryName',
            'Inventory category name already exists',
            'EXIST',
            id,
          ),
        );
      }
    }

    this.throwIfErrors();
  }
}
