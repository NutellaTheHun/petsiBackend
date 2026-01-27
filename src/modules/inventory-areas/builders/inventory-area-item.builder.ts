import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItemSizeBuilder } from '../../inventory-items/builders/inventory-item-size.builder';
import { CreateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/create-inventory-item-size.dto';
import { NestedCreateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../../inventory-items/dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { InventoryItemSize } from '../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { NestedCreateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-create-inventory-area-item.dto';
import { NestedUpdateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-update-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../entities/inventory-area-item.entity';

@Injectable()
export class InventoryAreaItemBuilder extends BuilderBase<InventoryAreaItem> {
  constructor(
    @InjectRepository(InventoryAreaCount)
    private readonly countRepo: Repository<InventoryAreaCount>,

    @InjectRepository(InventoryAreaItem)
    private readonly areaItemRepo: Repository<InventoryAreaItem>,

    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,

    @InjectRepository(InventoryItemSize)
    private readonly sizeRepo: Repository<InventoryItemSize>,

    private readonly itemSizeBuilder: InventoryItemSizeBuilder,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(
      InventoryAreaItem,
      'InventoryAreaItemBuilder',
      requestContextService,
      logger,
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
    if (dto.amount !== undefined) {
      this.amount(dto.amount);
    }

    // Either a ItemSize DTO or id
    if (dto.countedItemSize !== undefined) {
      if (dto.countedItemSize) {
        this.countedItemSizeByBuilder(dto.countedItemSize);
      }
    } else if (dto.countedItemSizeId !== undefined) {
      if (dto.countedItemSizeId) {
        this.countedItemSizeById(dto.countedItemSizeId);
      }
    }
  }

  protected updateEntity(dto: UpdateInventoryAreaItemDto): void {
    if (dto.countedInventoryItemId !== undefined) {
      this.countedItemById(dto.countedInventoryItemId);
    }
    if (dto.amount !== undefined) {
      this.amount(dto.amount);
    }

    if (dto.countedItemSizeId !== undefined) {
      if (dto.countedItemSizeId) {
        this.countedItemSizeById(dto.countedItemSizeId);
      }
    }
    if (dto.countedItemSize !== undefined) {
      if (dto.countedItemSize) {
        this.countedItemSizeByBuilder(dto.countedItemSize);
      }
    }
  }

  public async buildMany(
    parent: InventoryAreaCount,
    dtos: (
      | CreateInventoryAreaItemDto
      | NestedCreateInventoryAreaItemDto
      | NestedUpdateInventoryAreaItemDto
    )[],
  ): Promise<InventoryAreaItem[]> {
    const results: InventoryAreaItem[] = [];
    for (const dto of dtos) {
      if (dto instanceof CreateInventoryAreaItemDto) {
        results.push(await this.buildCreateDto(dto));
      } else {
        if ('createId' in dto) {
          results.push(await this.buildCreateDto(dto, parent, dto.createId));
        }
        if ('id' in dto) {
          const countedItem = await this.areaItemRepo.findOne({
            where: { id: dto.id },
            relations: [
              'parentInventoryCount',
              'countedInventoryItem',
              'countedItemSize',
            ],
          });
          if (!countedItem) {
            throw new Error('counted item is null');
          }
          results.push(await this.buildUpdateDto(countedItem, dto));
        }
      }
    }
    return results;
  }

  public countedItemById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.itemRepo.findOne({ where: { id } }),
      'countedInventoryItem',
      id,
    );
  }

  public countedItemByName(name: string): this {
    return this.setPropByName(
      async (name: string) => await this.itemRepo.findOne({ where: { name } }),
      'countedInventoryItem',
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
      async (id: number) => await this.sizeRepo.findOne({ where: { id } }),
      'countedItemSize',
      id,
    );
  }

  public countedItemSizeByBuilder(
    dto:
      | CreateInventoryItemSizeDto
      | NestedCreateInventoryItemSizeDto
      | NestedUpdateInventoryItemSizeDto,
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
      async (id: number) => await this.countRepo.findOne({ where: { id } }),
      'parentInventoryCount',
      id,
    );
  }
}
