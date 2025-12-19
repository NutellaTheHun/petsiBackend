import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemVendorDto } from '../dto/inventory-item-vendor/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/inventory-item-vendor/update-inventory-item-vendor.dto';
import {
  InventoryItemVendor,
  InventoryItemVendorEntity,
} from '../entities/inventory-item-vendor.entity';

@Injectable()
export class InventoryItemVendorValidator extends ValidatorBase<InventoryItemVendorEntity> {
  constructor(
    @InjectRepository(InventoryItemVendor)
    private readonly repo: Repository<InventoryItemVendor>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'InventoryItemVendor', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateInventoryItemVendorDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Vendor name exists
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'vendorName',
      results,
      'Vendor name already exists',
      id,
    );

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryItemVendorDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Vendor name exists
    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'vendorName',
        results,
        'Vendor name already exists',
        id,
      );
    }

    return this.checkValidateResult(results);
  }
}
