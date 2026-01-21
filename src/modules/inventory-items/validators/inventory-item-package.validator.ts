import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
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
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // Already exists check
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      errorMap,
      'Package name already exists',
    );

    return errorMap;
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryItemPackageDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        errorMap,
        'Package name already exists',
      );
    }

    return errorMap;
  }
}
