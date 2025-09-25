import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
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

  public async validateCreate(
    createId: string,
    dto: CreateInventoryItemDto,
  ): Promise<void> {
    // no existing name
    const exists = await this.repo.findOne({
      where: { itemName: dto.itemName },
    });
    if (await this.helper.exists(this.repo, 'itemName', dto.itemName)) {
      this.addError(
        this.buildValidationError(
          'itemName',
          'Inventory item already exists',
          'EXIST',
          undefined,
          createId,
        ),
      );
    }

    // no duplicate item sizing
    if (dto.itemSizeDtos && dto.itemSizeDtos.length > 0) {
      const nestedCreates = dto.itemSizeDtos
        .map((nested) => nested.createDto)
        .filter((nested) => nested !== undefined);

      const dupliateSizing = this.helper.findDuplicates(
        nestedCreates,
        (size) => `${size.inventoryPackageId}:${size.measureUnitId}`,
      );
      if (dupliateSizing) {
        for (const duplicate of dupliateSizing) {
          this.addError(
            this.buildValidationError(
              'itemSizes',
              'duplicate inventory item sizes',
              'DUPLICATE',
              undefined,
              duplicate.inventoryPackageId.toString(), // update createDtos to have createId?
            ),
          );
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
        this.addError(
          this.buildValidationError(
            'itemName',
            'Inventory item already exists',
            'EXIST',
            id,
          ),
        );
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
          nested.id &&
          (nested?.updateDto?.inventoryPackageId ||
            nested?.updateDto?.measureUnitId)
        ) {
          const currentSize = await this.sizeService.findOne(nested.id, [
            'measureUnit',
            'packageType',
          ]);
          if (!currentSize) {
            throw new Error();
          }

          const pkgId =
            nested?.updateDto?.inventoryPackageId ?? currentSize.packageType.id;
          const measureId =
            nested?.updateDto?.measureUnitId ?? currentSize.measureUnit.id;

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
          this.addError(
            this.buildValidationError(
              'itemSizes',
              'duplicate update item size requests',
              'EXIST',
              duplicate.id,
            ),
          );
        }
      }

      // Validate duplicate sizing
      const dupliateSizing = this.helper.findDuplicates(
        resolvedSizeDtos,
        (size) => `${size.inventoryPackageId}:${size.measureUnitId}`,
      );
      if (dupliateSizing) {
        for (const duplicate of dupliateSizing) {
          this.addError(
            this.buildValidationError(
              'itemSizes',
              'duplicate inventory item sizes',
              'EXIST',
              duplicate.inventoryPackageId,
            ),
          );
        }
      }
    }

    this.throwIfErrors();
  }
}
