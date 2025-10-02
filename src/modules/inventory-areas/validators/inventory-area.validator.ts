import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryArea } from '../entities/inventory-area.entity';

@Injectable()
export class InventoryAreaValidator extends ValidatorBase<InventoryArea> {
  constructor(
    @InjectRepository(InventoryArea)
    private readonly repo: Repository<InventoryArea>,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'InventoryArea', requestContextService, logger);
  }

  public async doValidateCreateNode(
    result: ValidationErrorNode,
    dto: any,
    id?: string | number,
    message?: string,
  ): Promise<void> {
    if (await this.helper.exists(this.repo, 'areaName', dto.areaName)) {
      result.addFieldError('areaName', 'Inventory area name already exists.');
    }
  }

  public async doValidateUpdateNode(
    result: ValidationErrorNode,
    dto: any,
    id?: string | number,
    message?: string,
  ): Promise<void> {
    if (await this.helper.exists(this.repo, 'areaName', dto.areaName)) {
      result.addFieldError('areaName', 'Inventory area name already exists.');
    }
  }
}
