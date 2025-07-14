import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationError } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItemSizeService } from '../services/inventory-item-size.service';

@Injectable()
export class InventoryItemSizeValidator extends ValidatorBase<InventoryItemSize> {
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

  public async validateCreate(dto: CreateInventoryItemSizeDto): Promise<void> {
    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    dto: NestedUpdateInventoryItemSizeDto | UpdateInventoryItemSizeDto,
  ): Promise<void> {
    if (dto instanceof NestedUpdateInventoryItemSizeDto) {
      dto = dto.dto;
    }
    if (dto.measureUnitId || dto.inventoryPackageId) {
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
        this.addError({
          errorMessage: 'Inventory item size already exists',
          errorType: 'EXIST',
          contextEntity: 'UpdateInventoryItemSizeDto',
          contextId: id,
          sourceEntity: 'InventoryItemSize',
        } as ValidationError);
      }
    }
    this.throwIfErrors();
  }
}
