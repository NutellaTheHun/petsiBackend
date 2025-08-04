import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../base/builder-base';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItemSizeBuilder } from '../../inventory-items/builders/inventory-item-size.builder';
import { CreateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/create-inventory-item-size.dto';
import { NestedInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-inventory-item-size.dto';
import { InventoryItemSizeService } from '../../inventory-items/services/inventory-item-size.service';
import { InventoryItemService } from '../../inventory-items/services/inventory-item.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { NestedInventoryAreaItemDto } from '../dto/inventory-area-item/nested-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';
import { InventoryAreaCountService } from '../services/inventory-area-count.service';
import { InventoryAreaItemService } from '../services/inventory-area-item.service';
import { InventoryAreaItemValidator } from '../validators/inventory-area-item.validator';

@Injectable()
export class InventoryAreaItemBuilder extends BuilderBase<InventoryAreaItem> {
  constructor(
    requestContextService: RequestContextService,
    @Inject(forwardRef(() => InventoryAreaCountService))
    private readonly countService: InventoryAreaCountService,

    @Inject(forwardRef(() => InventoryAreaItemService))
    private readonly itemCountService: InventoryAreaItemService,

    private readonly itemService: InventoryItemService,
    private readonly sizeService: InventoryItemSizeService,
    private readonly itemSizeBuilder: InventoryItemSizeBuilder,

    logger: AppLogger,
    validator: InventoryAreaItemValidator,
  ) {
    super(
      InventoryAreaItem,
      'InventoryAreaItemBuilder',
      requestContextService,
      logger,
      validator,
    );
  }

  protected createEntity(
    dto: CreateInventoryAreaItemDto,
    parent?: InventoryAreaCount,
  ): void {
    // If the parentInventoryCountId is provided, use it to set the parentInventoryCount. (Through inventory-area-item endpoint)
    // If the parentInventoryCountId is not provided, but a parent is provided, use the parent to set the parentInventoryCount. (Through create inventory-area-count endpoint)
    if (parent) {
      this.setPropByVal('parentInventoryCount', parent);
    } else if (dto.parentInventoryCountId !== undefined) {
      this.parentInventoryCountById(dto.parentInventoryCountId);
    }
    if (dto.countedInventoryItemId !== undefined) {
      this.countedItemById(dto.countedInventoryItemId);
    }
    if (dto.countedAmount !== undefined) {
      this.amount(dto.countedAmount);
    }

    // Either a ItemSize DTO or id
    if (dto.countedItemSizeDto !== undefined) {
      this.countedItemSizeByBuilder(dto.countedItemSizeDto);
    } else if (dto.countedItemSizeId !== undefined) {
      this.countedItemSizeById(dto.countedItemSizeId);
    }
  }

  protected updateEntity(dto: UpdateInventoryAreaItemDto): void {
    if (dto.countedInventoryItemId !== undefined) {
      this.countedItemById(dto.countedInventoryItemId);
    }
    if (dto.countedAmount !== undefined) {
      this.amount(dto.countedAmount);
    }

    if (dto.countedItemSizeId !== undefined) {
      this.countedItemSizeById(dto.countedItemSizeId);
    }
    if (dto.countedItemSizeDto !== undefined) {
      this.countedItemSizeByBuilder(dto.countedItemSizeDto);
    }
  }

  public async buildMany(
    parent: InventoryAreaCount,
    dtos: (CreateInventoryAreaItemDto | NestedInventoryAreaItemDto)[],
  ): Promise<InventoryAreaItem[]> {
    const results: InventoryAreaItem[] = [];
    for (const dto of dtos) {
      if (dto instanceof CreateInventoryAreaItemDto) {
        results.push(await this.buildCreateDto(dto));
      } else {
        if (dto.createDto) {
          results.push(await this.buildCreateDto(dto.createDto, parent));
        }
        if (dto.updateDto && dto.id) {
          const countedItem = await this.itemCountService.findOne(dto.id, [
            'parentInventoryCount',
            'countedItem',
            'countedItemSize',
          ]);
          if (!countedItem) {
            throw new Error('counted item is null');
          }
          results.push(await this.buildUpdateDto(countedItem, dto.updateDto));
        }
      }
    }
    return results;
  }

  public countedItemById(id: number): this {
    return this.setPropById(
      this.itemService.findOne.bind(this.itemService),
      'countedItem',
      id,
    );
  }

  public countedItemByName(name: string): this {
    return this.setPropByName(
      this.itemService.findOne.bind(this.itemService),
      'countedItem',
      name,
    );
  }

  public amount(amount: number): this {
    if (amount === null) {
      return this.setPropByVal('amount', 1);
    }
    return this.setPropByVal('amount', amount);
  }

  public countedItemSizeById(id: number): this {
    return this.setPropById(
      this.sizeService.findOne.bind(this.sizeService),
      'countedItemSize',
      id,
    );
  }

  public countedItemSizeByBuilder(
    dto: CreateInventoryItemSizeDto | NestedInventoryItemSizeDto,
  ): this {
    return this.setPropByBuilder(
      this.itemSizeBuilder.buildDto.bind(this.itemSizeBuilder),
      'countedItemSize',
      this.entity,
      dto,
    );
  }

  public parentInventoryCountById(id: number): this {
    return this.setPropById(
      this.countService.findOne.bind(this.countService),
      'parentInventoryCount',
      id,
    );
  }
}
