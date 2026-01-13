import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import {
  InventoryItem,
  InventoryItemEntity,
} from '../entities/inventory-item.entity';
import { InventoryItemSizeValidator } from './inventory-item-size.validator';

@Injectable()
export class InventoryItemValidator extends ValidatorBase<InventoryItemEntity> {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly repo: Repository<InventoryItem>,

    @Inject(forwardRef(() => InventoryItemSizeValidator))
    private readonly itemSizeValidator: InventoryItemSizeValidator,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'InventoryItem', requestContextService, logger);
  }

  public async doValidateCreateNode(
    dto: CreateInventoryItemDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // name
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      results,
      'Item with this name already exists',
      id,
    );

    if (dto.sizes?.length) {
      // inventoryItemSizeValidator Call
      const nestedDtoErrs = await this.itemSizeValidator.validateManyNestedNode(
        'sizes',
        dto.sizes,
      );
      if (nestedDtoErrs) {
        results.push(nestedDtoErrs);
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryItemDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        results,
        'Item with this name already exists',
        id,
      );
    }

    if (dto.sizes?.length) {
      // nested inventoryItemSizeValidator Call
      const nestedDtoErrs = await this.itemSizeValidator.validateManyNestedNode(
        'sizes',
        dto.sizes,
      );
      if (nestedDtoErrs) {
        results.push(nestedDtoErrs);
      }
    }

    return this.checkValidateResult(results);
  }
}
