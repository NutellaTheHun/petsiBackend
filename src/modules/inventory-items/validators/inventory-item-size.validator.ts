import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import {
  InventoryItemSize,
  InventoryItemSizeEntity,
} from '../entities/inventory-item-size.entity';
import { InventoryItemSizeService } from '../services/inventory-item-size.service';

@Injectable()
export class InventoryItemSizeValidator extends ValidatorBase<InventoryItemSizeEntity> {
  constructor(
    @InjectRepository(InventoryItemSize)
    private readonly repo: Repository<InventoryItemSize>,

    @Inject(forwardRef(() => InventoryItemSizeService))
    private readonly sizeService: InventoryItemSizeService,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'InventoryItemSize', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateInventoryItemSizeDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryItemSizeDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Cant update a item size to a already existing combination of packageType and measure unit size.
    if ((dto.measureUnitId || dto.inventoryPackageId) && id) {
      const currentSize = await this.sizeService.findOne(id, [
        'inventoryItem',
        'measureUnit',
        'packageType',
      ]);
      const exists = await this.repo.findOne({
        where: {
          measureUnit: { id: dto.measureUnitId ?? currentSize.measureUnit.id },
          packageType: {
            id: dto.inventoryPackageId ?? currentSize.packageType.id,
          },
          inventoryItem: { id: currentSize.inventoryItem.id },
        },
      });
      if (exists) {
        const prop = dto.measureUnitId ? 'measureUnit' : 'packageType';
        const err = new ValidationErrorNode(
          prop,
          id,
          'Inventory item size already exists',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }
}
