import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItemService } from '../../inventory-items/services/inventory-item.service';
import { InventoryItemSizeValidator } from '../../inventory-items/validators/inventory-item-size.validator';
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
    private readonly itemSizeValidator: InventoryItemSizeValidator,
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
        undefined,
        'Missing inventory item size assignment',
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
          undefined,
          'Size is not valid for this item.',
        );
        results.push(err);
      }
    }

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

    // cannot update item with no sizing
    if (
      dto.countedInventoryItemId &&
      !dto.countedItemSizeId &&
      !dto.countedItemSizeDto
    ) {
      const err = new ValidationErrorNode(
        'countedItemSize',
        undefined,
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
          undefined,
          'Invalid size for inventory item',
        );
        results.push(err);
      }
    }

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
