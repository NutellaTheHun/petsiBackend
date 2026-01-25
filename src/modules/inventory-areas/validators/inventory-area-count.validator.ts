import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
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
    repo: Repository<InventoryAreaCount>,
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
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    this.helper.enforceNotEmpty(
      dto.countedInventoryItems,
      'countedInventoryItems',
      errorMap,
      'Inventory count has no counted items',
    );

    // Nested Validator Call
    if (dto.countedInventoryItems?.length) {
      await this.areaItemValidator.validateManyNestedNode(
        'countedInventoryItems',
        dto.countedInventoryItems,
        errorMap,
      );
    }

    return errorMap;
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryAreaCountDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    if (dto.countedInventoryItems?.length) {
      this.helper.enforceNotEmpty(
        dto.countedInventoryItems,
        'countedInventoryItems',
        errorMap,
        'Inventory count cannot have 0 counted items',
      );

      // Nested Validator Call
      await this.areaItemValidator.validateManyNestedNode(
        'countedInventoryItems',
        dto.countedInventoryItems,
        errorMap,
      );
    }

    return errorMap;
  }
}
