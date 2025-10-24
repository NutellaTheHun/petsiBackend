import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
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
    private readonly _repo: Repository<InventoryAreaCount>,
    logger: AppLogger,
    requestContextService: RequestContextService,

    @Inject(forwardRef(() => InventoryAreaItemValidator))
    private readonly areaItemValidator: InventoryAreaItemValidator,
  ) {
    super(_repo, 'InventoryAreaCount', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateInventoryAreaCountDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Validate each InvAreaItemCountDto
    if (dto.itemCountDtos) {
      const valErrs = await this.areaItemValidator.validateManyNestedNode(
        'countedItems',
        dto.itemCountDtos,
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

    // inventoryAreaItemCount entity
    if (dto.itemCountDtos && dto.itemCountDtos.length > 0) {
      // Validate each InvAreaItemCountDto
      const valErrs = await this.areaItemValidator.validateManyNestedNode(
        'countedItems',
        dto.itemCountDtos,
      );
      if (valErrs) {
        results.push(valErrs);
      }
    }

    return this.checkValidateResult(results);
  }
}
