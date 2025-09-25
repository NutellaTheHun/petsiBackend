import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemVendorDto } from '../dto/inventory-item-vendor/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/inventory-item-vendor/update-inventory-item-vendor.dto';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';

@Injectable()
export class InventoryItemVendorValidator extends ValidatorBase<InventoryItemVendor> {
  constructor(
    @InjectRepository(InventoryItemVendor)
    private readonly repo: Repository<InventoryItemVendor>,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'InventoryItemVendor', requestContextService, logger);
  }

  public async validateCreate(
    createId: string,
    dto: CreateInventoryItemVendorDto,
  ): Promise<void> {
    if (await this.helper.exists(this.repo, 'vendorName', dto.vendorName)) {
      this.addError(
        this.buildValidationError(
          'vendorName',
          'Inventory vendor already exists',
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
    dto: UpdateInventoryItemVendorDto,
  ): Promise<void> {
    if (dto.vendorName) {
      if (await this.helper.exists(this.repo, 'vendorName', dto.vendorName)) {
        this.addError(
          this.buildValidationError(
            'vendorName',
            'Inventory vendor already exists',
            'EXIST',
            id,
          ),
        );
      }
    }

    this.throwIfErrors();
  }
}
