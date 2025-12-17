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
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Counted Amount
    this.helper.enforcePositive(
      dto.amount,
      'countedAmount',
      results,
      'Amount must be greater than 0',
      id,
    );

    // InventoryItemSize ID and InventoryItemSizeDto
    this.helper.enforceOnlyOne(
      dto,
      'countedItemSizeDto',
      'countedItemSizeId',
      results,
      'Must provide an item size or a new item size',
      'Cannot provide both an existing and new item size',
      id,
    );

    // CountedItemSize Reference
    if (dto.countedItemSizeId) {
      await this.helper.enforceValidSize<InventoryItem>(
        dto.countedItemSizeId,
        dto.countedInventoryItemId,
        this.inventoryItemRepo,
        'itemSizes',
        results,
        'Invalid size for inventory item',
        id,
      );
    }

    // Nested validator call
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

    // Counted Amount
    if (dto.amount) {
      this.helper.enforcePositive(
        dto.amount,
        'countedAmount',
        results,
        'Amount must be greater than 0',
        id,
      );
    }

    // If new counted InventoryItem, must have new size assignment.
    if (dto.countedInventoryItemId) {
      this.helper.enforceOnlyOne(
        dto,
        'countedItemSizeDto',
        'countedItemSizeId',
        results,
        'Must provide an item size or a new item size',
        'Cannot provide both an existing and new item size',
        id,
      );
    }

    // Validate InventoryItemSize
    if (dto.countedItemSizeId) {
      let countedItemId: number | null = null;
      if (dto.countedInventoryItemId) {
        countedItemId = dto.countedInventoryItemId;
      } else {
        const currentItem = await this.repo.findOne({
          where: { id },
          relations: ['countedItem'],
        });
        if (!currentItem) {
          throw new Error();
        }
        countedItemId = currentItem.countedInventoryItem.id;
      }

      await this.helper.enforceValidSize<InventoryItem>(
        dto.countedItemSizeId,
        countedItemId,
        this.inventoryItemRepo,
        'itemSizes',
        results,
        'Invalid size for inventory item',
        id,
      );
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
