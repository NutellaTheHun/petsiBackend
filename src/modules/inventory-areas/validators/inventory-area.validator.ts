import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { UpdateInventoryAreaDto } from '../dto/inventory-area/update-inventory-area.dto';
import {
  InventoryArea,
  InventoryAreaEntity,
} from '../entities/inventory-area.entity';

@Injectable()
export class InventoryAreaValidator extends ValidatorBase<InventoryAreaEntity> {
  constructor(
    @InjectRepository(InventoryArea)
    private readonly repo: Repository<InventoryArea>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'InventoryArea', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateInventoryAreaDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (await this.helper.exists(this.repo, 'areaName', dto.areaName)) {
      const err = new ValidationErrorNode(
        'areaName',
        id,
        'Inventory area name already exists.',
      );
      results.push(err);
    }

    this.helper.enforceNonNegative;

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryAreaDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.areaName) {
      if (await this.helper.exists(this.repo, 'areaName', dto.areaName)) {
        const err = new ValidationErrorNode(
          'areaName',
          id,
          'Inventory area name already exists.',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }
}
