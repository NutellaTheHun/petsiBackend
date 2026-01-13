import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemPackageDto } from '../dto/inventory-item-package/create-inventory-item-package.dto';
import { UpdateInventoryItemPackageDto } from '../dto/inventory-item-package/update-inventory-item-package.dto';
import {
  InventoryItemPackage,
  InventoryItemPackageEntity,
} from '../entities/inventory-item-package.entity';

@Injectable()
export class InventoryItemPackageValidator extends ValidatorBase<InventoryItemPackageEntity> {
  constructor(
    @InjectRepository(InventoryItemPackage)
    private readonly repo: Repository<InventoryItemPackage>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'InventoryItemPackage', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateInventoryItemPackageDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Already exists check
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      results,
      'Package name already exists',
      id,
    );

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryItemPackageDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        results,
        'Package name already exists',
        id,
      );
    }

    return this.checkValidateResult(results);
  }
}
