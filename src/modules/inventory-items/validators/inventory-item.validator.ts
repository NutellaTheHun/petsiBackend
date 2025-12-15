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
import { InventoryItemSizeValidator } from './inventory-item-size.validator';

@Injectable()
export class InventoryItemValidator extends ValidatorBase<InventoryItemEntity> {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly repo: Repository<InventoryItem>,

    @Inject(forwardRef(() => InventoryItemSizeValidator))
    private readonly itemSizeValidator: InventoryItemSizeValidator,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'InventoryItem', requestContextService, logger);
  }

  public async doValidateCreateNode(
    dto: CreateInventoryItemDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // existing name
    if (await this.helper.exists(this.repo, 'itemName', dto.itemName)) {
      const err = new ValidationErrorNode(
        'itemName',
        id,
        'Inventory item with this name already exists',
      );
      results.push(err);
    }

    if (dto.itemSizeDtos?.length) {
      // check for duplicate measure/package combinations

      const seen = new Set<string>();
      for (const nestedDto of dto.itemSizeDtos) {
        const createDto = nestedDto.createDto;
        if (!createDto) {
          throw new Error();
        }
        const key = `${createDto.measureUnitId}:${createDto.inventoryPackageId}`; // should include cost?
        if (seen.has(key)) {
          const err = new ValidationErrorNode(
            'itemSizes',
            id,
            'Cannot have duplicate item sizes',
          );
          results.push(err);
        } else {
          seen.add(key);
        }
      }

      // inventoryItemSizeValidator Call
      const nestedDtoErrs = await this.itemSizeValidator.validateManyNestedNode(
        'itemSizes',
        dto.itemSizeDtos,
      );
      if (nestedDtoErrs) {
        results.push(nestedDtoErrs);
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryItemDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.itemName) {
      // existing name
      if (await this.helper.exists(this.repo, 'itemName', dto.itemName)) {
        const err = new ValidationErrorNode(
          'itemName',
          id,
          'Inventory item with this name already exists',
        );
        results.push(err);
      }
    }

    if (dto.itemSizeDtos?.length) {
      const itemMap = new Map<string | number, string>();
      const seen = new Set<string>();
      const currentItem = await this.repo.findOne({
        where: { id },
        relations: [
          'itemSizes',
          'itemSizes.measureUnit',
          'itemSizes.packageType',
        ],
      });
      if (!currentItem) {
        throw new Error();
      }
      for (const item of currentItem.itemSizes) {
        itemMap.set(item.id, `${item.measureUnit.id}:${item.packageType.id}`);
      }
      //check for duplicate measure/package combinations
      for (const nestedDto of dto.itemSizeDtos) {
        if (nestedDto.createDto && nestedDto.createId) {
          itemMap.set(
            nestedDto.createId,
            `${nestedDto.createDto.measureUnitId}:${nestedDto.createDto.inventoryPackageId}`,
          );
        } else if (nestedDto.updateDto && nestedDto.id) {
          if (
            nestedDto.updateDto.measureUnitId ||
            nestedDto.updateDto.inventoryPackageId
          ) {
            const currentItem = itemMap.get(nestedDto.id)?.split(':');
            if (!currentItem || currentItem.length !== 2) {
              throw new Error();
            }

            itemMap.set(
              nestedDto.id,
              `${nestedDto.updateDto.measureUnitId ?? currentItem[0]}:${nestedDto.updateDto.inventoryPackageId ?? currentItem[1]}`,
            );
          }
        }
      }

      for (const val of itemMap.values()) {
        if (seen.has(val)) {
          const err = new ValidationErrorNode(
            'itemSizes',
            id,
            'Cannot have duplicate item sizes',
          );
          results.push(err);
        } else {
          seen.add(val);
        }
      }

      // inventoryItemSizeValidator Call
      const nestedDtoErrs = await this.itemSizeValidator.validateManyNestedNode(
        'itemSizes',
        dto.itemSizeDtos,
      );
      if (nestedDtoErrs) {
        results.push(nestedDtoErrs);
      }
    }

    return this.checkValidateResult(results);
  }
}
