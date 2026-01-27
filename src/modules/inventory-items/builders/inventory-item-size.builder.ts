import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryAreaItem } from '../../inventory-areas/entities/inventory-area-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { NestedCreateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItem } from '../entities/inventory-item.entity';

@Injectable()
export class InventoryItemSizeBuilder extends BuilderBase<InventoryItemSize> {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,

    @InjectRepository(UnitOfMeasure)
    private readonly unitRepo: Repository<UnitOfMeasure>,

    @InjectRepository(InventoryItemPackage)
    private readonly packageRepo: Repository<InventoryItemPackage>,

    @InjectRepository(InventoryItemSize)
    private readonly sizeRepo: Repository<InventoryItemSize>,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      InventoryItemSize,
      'InventoryItemSizeBuilder',
      requestContextService,
      logger,
    );
  }

  protected createEntity(
    dto: CreateInventoryItemSizeDto,
    parent?: InventoryItem,
  ): void {
    // If the parentInventoryItemId is provided, use it to set the parentInventoryItem. (Through inventory-item-size endpoint)
    // If the parentInventoryItemId is not provided, but a parent is provided, use the parent to set the parentInventoryItem. (Through create inventory-item endpoint)
    if (parent) {
      this.setPropByVal('inventoryItem', parent);
    } else if (dto.inventoryItemId !== undefined) {
      this.inventoryItemById(dto.inventoryItemId);
    }

    if (dto.packageId !== undefined) {
      this.packageById(dto.packageId);
    }
    if (dto.measureTypeId !== undefined) {
      this.unitOfMeasureById(dto.measureTypeId);
    }
    if (dto.cost !== undefined) {
      this.costByValue(dto.cost);
    } else {
      this.costByValue(0);
    }
    if (dto.measureAmount !== undefined) {
      this.measureAmount(dto.measureAmount);
    }
  }

  protected updateEntity(dto: UpdateInventoryItemSizeDto): void {
    if (dto.packageId !== undefined) {
      this.packageById(dto.packageId);
    }
    if (dto.measureTypeId !== undefined) {
      this.unitOfMeasureById(dto.measureTypeId);
    }
    if (dto.cost !== undefined) {
      this.costByValue(dto.cost);
    }
    if (dto.measureAmount !== undefined) {
      this.measureAmount(dto.measureAmount);
    }
  }

  public async buildMany(
    parent: InventoryItem,
    dtos: (
      | CreateInventoryItemSizeDto
      | NestedCreateInventoryItemSizeDto
      | NestedUpdateInventoryItemSizeDto
    )[],
  ): Promise<InventoryItemSize[]> {
    const results: InventoryItemSize[] = [];
    for (const dto of dtos) {
      if (dto instanceof CreateInventoryItemSizeDto) {
        results.push(await this.buildCreateDto(dto));
      } else {
        if ('createId' in dto) {
          results.push(await this.buildCreateDto(dto, parent));
        }
        if ('id' in dto) {
          const size = await this.sizeRepo.findOne({
            where: { id: dto.id },
            relations: ['inventoryItem', 'measureType', 'package'],
          });
          if (!size) {
            throw new Error('item size not found');
          }
          results.push(await this.buildUpdateDto(size, dto));
        }
      }
    }
    return results;
  }

  public async createMany(
    dtos: CreateInventoryItemSizeDto[],
  ): Promise<InventoryItemSize[]> {
    const results: InventoryItemSize[] = [];
    for (const dto of dtos) {
      results.push(await this.buildCreateDto(dto));
    }
    return results;
  }

  /**
   * Called when creating/updating inventory-area-item
   * @param parentItem Not required in this instance, but is kept to follow the builderbase.setPropByBuilder signature
   * @param dto
   * @returns
   */
  public async buildDto(
    parent: InventoryItem | InventoryAreaItem,
    dto:
      | CreateInventoryItemSizeDto
      | NestedCreateInventoryItemSizeDto
      | NestedUpdateInventoryItemSizeDto,
  ): Promise<InventoryItemSize> {
    if (dto instanceof CreateInventoryItemSizeDto) {
      return await this.buildCreateDto(dto);
    }
    if ('createId' in dto) {
      return await this.buildCreateDto(dto, parent);
    }
    if ('id' in dto) {
      const size = await this.sizeRepo.findOne({
        where: { id: dto.id },
        relations: ['inventoryItem', 'measureType', 'package'],
      });
      if (!size) {
        throw new Error('item size not found');
      }
      return await this.buildUpdateDto(size, dto);
    }

    throw new Error('invalid dto');
  }

  public unitOfMeasureById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.unitRepo.findOne({ where: { id } }),
      'measureType',
      id,
    );
  }

  public unitOfMeasureByName(name: string): this {
    return this.setPropByName(
      async (name: string) => await this.unitRepo.findOne({ where: { name } }),
      'measureType',
      name,
    );
  }

  public packageById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.packageRepo.findOne({ where: { id } }),
      'package',
      id,
    );
  }

  public packageByName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.packageRepo.findOne({ where: { name } }),
      'package',
      name,
    );
  }

  public inventoryItemById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.itemRepo.findOne({ where: { id } }),
      'inventoryItem',
      id,
    );
  }

  public inventoryItemByName(name: string): this {
    return this.setPropByName(
      async (name: string) => await this.itemRepo.findOne({ where: { name } }),
      'inventoryItem',
      name,
    );
  }

  public costByValue(val: number): this {
    return this.setPropByVal('cost', String(val));
  }

  public measureAmount(amount: number): this {
    return this.setPropByVal('measureAmount', amount);
  }
}
