import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
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
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      errorMap,
      'Inventory area name already exists.',
    );

    return errorMap;
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryAreaDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        errorMap,
        'Inventory area name already exists.',
      );
    }

    return errorMap;
  }
}
