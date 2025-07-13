import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationError } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryItemSizeService } from '../services/inventory-item-size.service';

@Injectable()
export class InventoryItemValidator extends ValidatorBase<InventoryItem> {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly repo: Repository<InventoryItem>,

    @Inject(forwardRef(() => InventoryItemSizeService))
    private readonly sizeService: InventoryItemSizeService,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'InventoryItem', requestContextService, logger);
  }

  public async validateCreate(dto: CreateInventoryItemDto): Promise<void> {
    // no existing name
    const exists = await this.repo.findOne({
      where: { itemName: dto.itemName },
    });
    if (await this.helper.exists(this.repo, 'itemName', dto.itemName)) {
      this.addError({
        errorMessage: 'Inventory item already exists',
        errorType: 'EXIST',
        contextEntity: 'CreateInventoryItemDto',
        sourceEntity: 'InventoryItem',
        value: dto.itemName,
      } as ValidationError);
    }

    // no duplicate item sizing
    if (dto.itemSizeDtos && dto.itemSizeDtos.length > 0) {
      const dupliateSizing = this.helper.findDuplicates(
        dto.itemSizeDtos,
        (size) => `${size.inventoryPackageId}:${size.measureUnitId}`,
      );
      if (dupliateSizing) {
        for (const duplicate of dupliateSizing) {
          this.addError({
            errorMessage: 'duplicate inventory item sizes',
            errorType: 'DUPLICATE',
            contextEntity: 'CreateInventoryItemDto',
            sourceEntity: 'CreateChildInventoryItemSizeDto',
            value: {
              packageId: duplicate.inventoryPackageId,
              measureId: duplicate.measureUnitId,
            },
          } as ValidationError);
        }
      }
    }

    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    dto: UpdateInventoryItemDto,
  ): Promise<void> {
    // no existing name
    if (dto.itemName) {
      if (await this.helper.exists(this.repo, 'itemName', dto.itemName)) {
        this.addError({
          errorMessage: 'Inventory item already exists',
          errorType: 'EXIST',
          contextEntity: 'UpdateInventoryItemDto',
          contextId: id,
          sourceEntity: 'InventoryItem',
          value: dto.itemName,
        } as ValidationError);
      }
    }

    // no duplicate item sizing, or duplicate update ids
    if (dto.itemSizeDtos && dto.itemSizeDtos.length > 0) {
      const resolvedUpdateDtos: { id: number }[] = [];
      const resolvedSizeDtos: {
        inventoryPackageId: number;
        measureUnitId: number;
      }[] = [];
      for (const nested of dto.itemSizeDtos) {
        if (
          nested?.update?.dto?.inventoryPackageId ||
          nested?.update?.dto?.measureUnitId
        ) {
          const currentSize = await this.sizeService.findOne(nested.update.id, [
            'measureUnit',
            'packageType',
          ]);
          if (!currentSize) {
            throw new Error();
          }

          const pkgId =
            nested?.update?.dto?.inventoryPackageId ??
            currentSize.packageType.id;
          const measureId =
            nested?.update?.dto?.measureUnitId ?? currentSize.measureUnit.id;

          resolvedSizeDtos.push({
            inventoryPackageId: pkgId,
            measureUnitId: measureId,
          });
        }
      }

      // Validate duplicate update ids
      const dupliateIds = this.helper.findDuplicates(
        resolvedUpdateDtos,
        (id) => `${id.id}`,
      );
      if (dupliateIds) {
        for (const duplicate of dupliateIds) {
          this.addError({
            errorMessage: 'duplicate update item size requests',
            errorType: 'DUPLICATE',
            contextEntity: 'UpdateInventoryItemDto',
            contextId: id,
            sourceEntity: 'UpdateChildInventoryItemSizeDto',
            sourceId: duplicate.id,
          } as ValidationError);
        }
      }

      // Validate duplicate sizing
      const dupliateSizing = this.helper.findDuplicates(
        resolvedSizeDtos,
        (size) => `${size.inventoryPackageId}:${size.measureUnitId}`,
      );
      if (dupliateSizing) {
        for (const duplicate of dupliateSizing) {
          this.addError({
            errorMessage: 'duplicate inventory item sizes',
            errorType: 'DUPLICATE',
            contextEntity: 'UpdateInventoryItemDto',
            contextId: id,
            sourceEntity:
              'CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto',
            value: {
              packageId: duplicate.inventoryPackageId,
              measureId: duplicate.measureUnitId,
            },
          } as ValidationError);
        }
      }
    }

    this.throwIfErrors();
  }
}
