import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { InventoryItemSizeValidator } from '../../inventory-items/validators/inventory-item-size.validator';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
import {
  InventoryAreaItem,
  InventoryAreaItemEntity,
} from '../entities/inventory-area-item.entity';

@Injectable()
export class InventoryAreaItemValidator extends ValidatorBase<InventoryAreaItemEntity> {
  constructor(
    @InjectRepository(InventoryAreaItem)
    private readonly repo: Repository<InventoryAreaItem>,
    @InjectRepository(InventoryItem)
    private readonly inventoryItemRepo: Repository<InventoryItem>,

    @Inject(forwardRef(() => InventoryItemSizeValidator))
    private readonly itemSizeValidator: InventoryItemSizeValidator,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'InventoryAreaItem', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateInventoryAreaItemDto,
    createId?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // amount cannot be less than or equal to 0
    if (dto.countedAmount <= 0) {
      const err = new ValidationErrorNode(
        'amount',
        createId,
        'Amount must be greater than 0',
      );
      results.push(err);
    }

    // Must have either itemSizeId or itemSizeDto
    if (!dto.countedItemSizeId && !dto.countedItemSizeDto) {
      const err = new ValidationErrorNode(
        'countedItemSize',
        createId,
        'Missing inventory item size assignment',
      );
      results.push(err);
    }

    // !! itemSizeId must be valid to item !!
    if (dto.countedItemSizeId) {
    }

    // Nested Item Size Dto
    if (dto.countedItemSizeDto) {
      const nestedDtoErr = await this.itemSizeValidator.validateNestedNode(
        'countedItemSize',
        dto.countedItemSizeDto,
      );
      if (nestedDtoErr) {
        results.push(nestedDtoErr);
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryAreaItemDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // amount cannot be less than or equal to 0
    if (dto.countedAmount && dto.countedAmount <= 0) {
      const err = new ValidationErrorNode(
        'amount',
        id,
        'Amount must be greater than 0',
      );
      results.push(err);
    }

    // cannot update item with no sizing
    if (
      dto.countedInventoryItemId &&
      !dto.countedItemSizeId &&
      !dto.countedItemSizeDto
    ) {
      const err = new ValidationErrorNode(
        'countedItemSize',
        id,
        'missing inventory item size assignment',
      );
      results.push(err);
    }

    // Check if counted item and counted size are valid
    // if update pertains countedInventoryItem and/or countedItemSize
    // (must exclude countedInventoryItem/ItemSizeDto combo)
    else if (
      (dto.countedInventoryItemId ||
        (dto.countedItemSizeId && !dto.countedItemSizeDto)) &&
      id
    ) {
      const toUpdate = await this.repo.findOne({
        where: { id },
        relations: ['countedItem', 'countedItemSize'],
      });
      if (!toUpdate) {
        throw new Error('entity to update not found');
      }

      const itemId = dto.countedInventoryItemId ?? toUpdate.countedItem.id;
      const sizeId = dto.countedItemSizeId ?? toUpdate.countedItemSize.id;

      const item = await this.inventoryItemRepo.findOne({
        where: { id: itemId },
        relations: ['itemSizes'],
      });
      if (!item) {
        throw new Error(
          `InventoryAreaItem valiation: InventoryItem with id ${itemId} not found`,
        );
      }
      if (item.itemSizes?.length) {
        if (!this.helper.isValidSize(sizeId, item.itemSizes)) {
          const err = new ValidationErrorNode(
            'countedItemSize',
            id,
            'Invalid size for inventory item',
          );
          results.push(err);
        }
      } else {
        const err = new ValidationErrorNode(
          'countedItemSize',
          id,
          'Invalid size for inventory item',
        );
        results.push(err);
      }
    }

    // Nested ItemSize validation
    if (dto.countedItemSizeDto) {
      const nestedDtoErr = await this.itemSizeValidator.validateNestedNode(
        'countedItemSize',
        dto.countedItemSizeDto,
      );
      if (nestedDtoErr) {
        results.push(nestedDtoErr);
      }
    }

    return this.checkValidateResult(results);
  }
}
