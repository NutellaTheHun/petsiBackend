import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import {
  InventoryAreaCount,
  InventoryAreaCountEntity,
} from '../entities/inventory-area-count.entity';
import { InventoryAreaItemValidator } from './inventory-area-item.validator';

@Injectable()
export class InventoryAreaCountValidator extends ValidatorBase<InventoryAreaCountEntity> {
  constructor(
    @InjectRepository(InventoryAreaCount)
    private readonly repo: Repository<InventoryAreaCount>,
    logger: AppLogger,
    requestContextService: RequestContextService,

    @Inject(forwardRef(() => InventoryAreaItemValidator))
    private readonly areaItemValidator: InventoryAreaItemValidator,
  ) {
    super(repo, 'InventoryAreaCount', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateInventoryAreaCountDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    this.helper.enforceNotEmpty(
      dto.countedInventoryItems,
      'itemCountDtos',
      results,
      'Inventory count has no counted items',
      id,
    );

    // Nested Validator Call
    if (dto.countedInventoryItems?.length) {
      const valErrs = await this.areaItemValidator.validateManyNestedNode(
        'countedItems',
        dto.countedInventoryItems,
      );
      if (valErrs) {
        results.push(valErrs);
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryAreaCountDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.countedInventoryItems?.length) {
      this.helper.enforceNotEmpty(
        dto.countedInventoryItems,
        'itemCountDtos',
        results,
        'Inventory count cannot have 0 counted items',
        id,
      );

      // Nested Validator Call
      const valErrs = await this.areaItemValidator.validateManyNestedNode(
        'countedItems',
        dto.countedInventoryItems,
      );
      if (valErrs) {
        results.push(valErrs);
      }
    }

    return this.checkValidateResult(results);
  }
}
