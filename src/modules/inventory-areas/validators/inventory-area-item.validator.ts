import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItemService } from '../../inventory-items/services/inventory-item.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
import {
  InventoryAreaItem,
  InventoryAreaItemEntity,
} from '../entities/inventory-area-item.entity';
import { InventoryAreaItemService } from '../services/inventory-area-item.service';

@Injectable()
export class InventoryAreaItemValidator extends ValidatorBase<InventoryAreaItemEntity> {
  constructor(
    @InjectRepository(InventoryAreaItem)
    private readonly repo: Repository<InventoryAreaItem>,

    @Inject(forwardRef(() => InventoryAreaItemService))
    private readonly areaItemService: InventoryAreaItemService,

    private readonly itemService: InventoryItemService,
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

    // Must have either itemSizeId or itemSizeDto
    if (!dto.countedItemSizeId && !dto.countedItemSizeDto) {
      const err = new ValidationErrorNode(
        'countedItemSize',
        createId,
        'Missing inventory item size assignment',
      );
      results.push(err);

      // Cannot have both itemSizeId or itemSizeDto
    } else if (dto.countedItemSizeId && dto.countedItemSizeDto) {
      const err = new ValidationErrorNode(
        'countedItemSize',
        createId,
        'Cannot provide inventory item size and create dto',
      );
      results.push(err);
    }

    //InventoryItem and ItemSize must be valid
    if (dto.countedItemSizeId) {
      const item = await this.itemService.findOne(dto.countedInventoryItemId, [
        'itemSizes',
      ]);
      if (!this.helper.isValidSize(dto.countedItemSizeId, item.itemSizes)) {
        const err = new ValidationErrorNode(
          'countedItemSize',
          createId,
          'Size is not valid for this item.',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryAreaItemDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Cannot update with both item size and item size dto
    if (dto.countedItemSizeId && dto.countedItemSizeDto) {
      const err = new ValidationErrorNode(
        'countedItemSize',
        id,
        'cannot provide inventory item size and create dto',
      );
      results.push(err);
    }

    // cannot update item with no sizing
    else if (
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
    else if (
      (dto.countedInventoryItemId ||
        (dto.countedItemSizeId && !dto.countedItemSizeDto)) &&
      id
    ) {
      const toUpdate = await this.areaItemService.findOne(id, [
        'countedItem',
        'countedItemSize',
      ]);
      if (!toUpdate) {
        throw new Error('entity to update not found');
      }

      const itemId = dto.countedInventoryItemId ?? toUpdate.countedItem.id;
      const sizeId = dto.countedItemSizeId ?? toUpdate.countedItemSize.id;

      const item = await this.itemService.findOne(itemId, ['itemSizes']);
      if (!this.helper.isValidSize(sizeId, item.itemSizes)) {
        const err = new ValidationErrorNode(
          'countedItemSize',
          id,
          'Invalid size for inventory item',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }
}
