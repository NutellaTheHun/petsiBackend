import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
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

  public async validateCreate(
    createId: string,
    dto: CreateInventoryItemPackageDto,
  ): Promise<void> {
    // Already exists check
    if (await this.helper.exists(this.repo, 'packageName', dto.packageName)) {
      this.addError(
        this.buildValidationError(
          'packageName',
          'Inventory package name already exists',
          'EXIST',
          undefined,
          createId,
        ),
      );
    }
    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    dto: UpdateInventoryItemPackageDto,
  ): Promise<void> {
    // Already exists check
    if (dto.packageName) {
      if (await this.helper.exists(this.repo, 'packageName', dto.packageName)) {
        this.addError(
          this.buildValidationError(
            'packageName',
            'Inventory package name already exists',
            'EXIST',
            id,
          ),
        );
      }
    }
    this.throwIfErrors();
  }
}
