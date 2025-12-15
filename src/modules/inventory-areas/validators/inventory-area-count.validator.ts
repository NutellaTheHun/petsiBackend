import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import {
  InventoryAreaCount,
  InventoryAreaCountEntity,
} from '../entities/inventory-area-count.entity';
import { InventoryAreaItemValidator } from './inventory-area-item.validator';

@Injectable()
export class InventoryAreaCountValidator extends ValidatorBase<InventoryAreaCountEntity> {
  constructor(
    @InjectRepository(InventoryAreaCount)
    private readonly repo: Repository<InventoryAreaCount>,
    logger: AppLogger,
    requestContextService: RequestContextService,

    @Inject(forwardRef(() => InventoryAreaItemValidator))
    private readonly areaItemValidator: InventoryAreaItemValidator,
  ) {
    super(repo, 'InventoryAreaCount', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateInventoryAreaCountDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.itemCountDtos?.length) {
      // !! Check itemCountDto inventoryItem/itemSize duplicates
      const seen = new Set<string>();
      for (const nestedDto of dto.itemCountDtos) {
        const createDto = nestedDto.createDto;
        if (!createDto || !nestedDto.createId) {
          throw new Error();
        }
        const key = `${createDto.countedInventoryItemId}:${createDto.countedItemSizeId ?? 0}`;
        if (seen.has(key)) {
          const err = new ValidationErrorNode(
            'countedItems',
            id,
            'cannot have duplicate inventory items',
          );
          results.push(err);
        } else {
          seen.add(key);
        }
      }

      // Nested Validator Call
      const valErrs = await this.areaItemValidator.validateManyNestedNode(
        'countedItems',
        dto.itemCountDtos,
      );
      if (valErrs) {
        results.push(valErrs);
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryAreaCountDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // inventoryAreaItemCount entity
    if (dto.itemCountDtos?.length) {
      //Check itemCountDto inventoryItem/itemSize duplicates
      const itemMap = new Map<string | number, string>();
      const seen = new Set<string>();
      const currentCount = await this.repo.findOne({
        where: { id },
        relations: [
          'countedItems',
          'countedItems.countedItem',
          'countedItems.countedItemSize',
        ],
      });
      if (!currentCount || !currentCount.countedItems.length) {
        throw new Error();
      }
      for (const item of currentCount.countedItems) {
        itemMap.set(
          item.id,
          `${item.countedItem.id},${item.countedItemSize.id}`,
        );
      }

      for (const nestedDto of dto.itemCountDtos) {
        if (nestedDto.createDto && nestedDto.createId) {
          if (nestedDto.createDto.countedItemSizeId) {
            itemMap.set(
              nestedDto.createId,
              `${nestedDto.createDto.countedInventoryItemId},${nestedDto.createDto.countedItemSizeId}`,
            );
          }
        } else if (nestedDto.updateDto && nestedDto.id) {
          if (
            nestedDto.updateDto.countedInventoryItemId ||
            nestedDto.updateDto.countedItemSizeId
          ) {
            const currentItem = itemMap.get(nestedDto.id)?.split(':');
            if (!currentItem || currentItem.length !== 2) {
              throw new Error();
            }
            itemMap.set(
              nestedDto.id,
              `${nestedDto.updateDto.countedInventoryItemId ?? currentCount[0]},${nestedDto.updateDto.countedItemSizeId ?? currentCount[1]}`,
            );
          }
        }
      }
      for (const val of itemMap.values()) {
        if (seen.has(val)) {
          const err = new ValidationErrorNode(
            'countedItems',
            id,
            'cannot have duplicate inventory items',
          );
          results.push(err);
        } else {
          seen.add(val);
        }
      }

      // Nested Validator Call
      const valErrs = await this.areaItemValidator.validateManyNestedNode(
        'countedItems',
        dto.itemCountDtos,
      );
      if (valErrs) {
        results.push(valErrs);
      }
    }

    return this.checkValidateResult(results);
  }
}
