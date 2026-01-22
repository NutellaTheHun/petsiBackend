import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { InventoryItemSizeValidator } from '../../inventory-items/validators/inventory-item-size.validator';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { NestedCreateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-create-inventory-area-item.dto';
import { NestedUpdateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-update-inventory-area-item.dto';
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
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // Counted Amount
    this.helper.enforcePositive(
      dto.amount,
      'amount',
      errorMap,
      'Amount must be greater than 0',
    );

    // InventoryItemSize ID and InventoryItemSizeDto
    this.helper.enforceOnlyOne(
      dto,
      'countedItemSize',
      'countedItemSizeId',
      errorMap,
      'Must provide an item size or a new item size',
      'Cannot provide both an existing and new item size',
    );

    // CountedItemSize Reference
    if (dto.countedItemSizeId) {
      await this.helper.enforceValidSize(
        dto.countedItemSizeId,
        dto.countedInventoryItemId,
        this.inventoryItemRepo,
        'sizes',
        'countedItemSize',
        errorMap,
        'Invalid size for inventory item',
      );
    }

    // Nested validator call
    if (dto.countedItemSize) {
      await this.itemSizeValidator.validateNestedNode(
        'countedItemSize',
        dto.countedItemSize,
        errorMap,
      );
    }

    return errorMap;
  }

  protected async doValidateNestedCreateNode(
    dto: NestedCreateInventoryAreaItemDto,
    id: string,
  ): Promise<ValidationErrorMap> {
    // Currently no difference in validation between nested create and root create
    return await this.doValidateCreateNode(
      dto as unknown as CreateInventoryAreaItemDto,
      id,
    );
  }

  protected async doValidateNestedUpdateNode(
    dto: NestedUpdateInventoryAreaItemDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    // Currently no difference in validation between nested update and root update
    return await this.doValidateUpdateNode(
      dto as unknown as UpdateInventoryAreaItemDto,
      id,
    );
  }

  protected async doValidateUpdateNode(
    dto: UpdateInventoryAreaItemDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // Counted Amount
    if (dto.amount) {
      this.helper.enforcePositive(
        dto.amount,
        'amount',
        errorMap,
        'Amount must be greater than 0',
      );
    }

    // If new counted InventoryItem, must have new size assignment.
    if (dto.countedInventoryItemId) {
      this.helper.enforceOnlyOne(
        dto,
        'countedItemSize',
        'countedItemSizeId',
        errorMap,
        'Must provide an item size or a new item size',
        'Cannot provide both an existing and new item size',
      );
    }

    if (dto.countedItemSize || dto.countedItemSizeId) {
      await this.helper.enforceOnlyOne(
        dto,
        'countedItemSize',
        'countedItemSizeId',
        errorMap,
        'Must provide an item size or a new item size',
        'Cannot provide both an existing and new item size',
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

      await this.helper.enforceValidSize(
        dto.countedItemSizeId,
        countedItemId,
        this.inventoryItemRepo,
        'sizes',
        'countedItemSize',
        errorMap,
        'Invalid size for inventory item',
      );
    }

    // Nested ItemSize validation
    if (dto.countedItemSize) {
      await this.itemSizeValidator.validateNestedNode(
        'countedItemSize',
        dto.countedItemSize,
        errorMap,
      );
    }

    return errorMap;
  }
}
