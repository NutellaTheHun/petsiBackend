import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationError } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItemService } from '../../inventory-items/services/inventory-item.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { InventoryAreaItemService } from '../services/inventory-area-item.service';

@Injectable()
export class InventoryAreaItemValidator extends ValidatorBase<InventoryAreaItem> {
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

  public async validateCreate(dto: CreateInventoryAreaItemDto): Promise<void> {
    // Must have either itemSizeId or itemSizeDto
    if (!dto.countedItemSizeId && !dto.countedItemSizeDto) {
      this.addError({
        errorMessage: 'missing inventory item size assignment',
        errorType: 'MISSING',
        contextEntity: 'CreateInventoryAreaItemDto',
        sourceEntity: 'InventoryItemSize',
      } as ValidationError);
    }

    // Cannot have both itemSizeId or itemSizeDto
    else if (dto.countedItemSizeId && dto.countedItemSizeDto) {
      this.addError({
        errorMessage: 'cannot provide inventory item size and create dto',
        errorType: 'INVALID',
        contextEntity: 'CreateInventoryAreaItemDto',
        sourceEntity: 'InventoryItemSize',
      } as ValidationError);
    }

    //InventoryItem and ItemSize must be valid
    if (dto.countedItemSizeId) {
      const item = await this.itemService.findOne(dto.countedInventoryItemId, [
        'itemSizes',
      ]);

      if (!this.helper.isValidSize(dto.countedItemSizeId, item.itemSizes)) {
        this.addError({
          errorMessage: 'inventory item size not valid for inventory item',
          errorType: 'INVALID',
          contextEntity: 'CreateInventoryAreaItemDto',
          sourceEntity: 'InventoryItemSize',
          sourceId: dto.countedItemSizeId,
          conflictEntity: 'InventoryItem',
          conflictId: item.id,
        } as ValidationError);
      }
    }

    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    update: UpdateInventoryAreaItemDto,
  ): Promise<void> {
    // Cannot update with both item size and item size dto
    if (update.countedItemSizeId && update.countedItemSizeDto) {
      this.addError({
        errorMessage: 'cannot provide inventory item size and create dto',
        errorType: 'INVALID',
        contextEntity: 'UpdateInventoryAreaItemDto',
        contextId: id,
        sourceEntity: 'InventoryItemSize',
      } as ValidationError);
    }

    // cannot update item with no sizing
    else if (
      update.countedInventoryItemId &&
      !update.countedItemSizeId &&
      !update.countedItemSizeDto
    ) {
      this.addError({
        errorMessage: 'missing inventory item size assignment',
        errorType: 'INVALID',
        contextEntity: 'UpdateInventoryAreaItemDto',
        contextId: id,
        sourceEntity: 'InventoryItemSize',
      } as ValidationError);
    }

    // Check if counted item and counted size are valid
    else if (
      update.countedInventoryItemId ||
      (update.countedItemSizeId && !update.countedItemSizeDto)
    ) {
      const toUpdate = await this.areaItemService.findOne(id, [
        'countedItem',
        'countedItemSize',
      ]);
      if (!toUpdate) {
        throw new Error();
      }

      const itemId = update.countedInventoryItemId ?? toUpdate.countedItem.id;
      const sizeId = update.countedItemSizeId ?? toUpdate.countedItemSize.id;

      const item = await this.itemService.findOne(itemId, ['itemSizes']);
      if (!this.helper.isValidSize(sizeId, item.itemSizes)) {
        this.addError({
          errorMessage: 'Invalid size for inventory item',
          errorType: 'INVALID',
          contextEntity: 'UpdateInventoryAreaItemDto',
          contextId: id,
          sourceEntity: 'InventoryItemSize',
          sourceId: sizeId,
          conflictEntity: 'InventoryItem',
          conflictId: item.id,
        } as ValidationError);
      }
    }

    this.throwIfErrors();
  }
}
