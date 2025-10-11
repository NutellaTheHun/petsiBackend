import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import {
  InventoryItem,
  InventoryItemEntity,
} from '../entities/inventory-item.entity';
import { InventoryItemSizeService } from '../services/inventory-item-size.service';
import { InventoryItemSizeValidator } from './inventory-item-size.validator';

@Injectable()
export class InventoryItemValidator extends ValidatorBase<InventoryItemEntity> {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly repo: Repository<InventoryItem>,

    @Inject(forwardRef(() => InventoryItemSizeService))
    private readonly sizeService: InventoryItemSizeService,
    logger: AppLogger,
    requestContextService: RequestContextService,
    private readonly itemSizeValidator: InventoryItemSizeValidator
  ) {
    super(repo, 'InventoryItem', requestContextService, logger);
  }

  public async doValidateCreateNode(
    dto: CreateInventoryItemDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // no existing name
    if (await this.helper.exists(this.repo, 'itemName', dto.itemName)) {
      const err = new ValidationErrorNode(
        'itemName',
        id,
        'Inventory item with this name already exists',
      );
      results.push(err);
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
            const err = new ValidationErrorNode(
                'itemSizes',
                duplicate. // need to get ID of nested entity
            )
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

      // inventoryItemSizeValidator Call
      const errs = await this.itemSizeValidator.validateManyNestedNode('itemSizes', dto.itemSizeDtos);
      if(errs){
        results.push(errs);
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(dto: UpdateInventoryItemDto, id?: number): Promise<ValidationErrorNode[] | null> {
      const results: ValidationErrorNode[] = [];

      if(dto.itemName){
        // no existing name
            if (await this.helper.exists(this.repo, 'itemName', dto.itemName)) {
            const err = new ValidationErrorNode(
                'itemName',
                id,
                'Inventory item with this name already exists',
            );
            results.push(err);
            }
      }

    // no duplicate item sizing, or duplicate update ids
    if (dto.itemSizeDtos && dto.itemSizeDtos.length > 0) {
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

      // inventoryItemSizeValidator Call
      const errs = await this.itemSizeValidator.validateManyNestedNode('itemSizes', dto.itemSizeDtos);
      if(errs){
        results.push(errs);
      }

      
  }

  return this.checkValidateResult(results);
}
}
