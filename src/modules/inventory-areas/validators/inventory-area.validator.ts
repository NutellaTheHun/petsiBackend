import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
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

    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'areaName',
      results,
      'Inventory area name already exists.',
      id,
    );

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryAreaDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'areaName',
        results,
        'Inventory area name already exists.',
        id,
      );
    }

    return this.checkValidateResult(results);
  }
}
