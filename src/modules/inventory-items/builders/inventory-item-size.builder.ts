import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../base/builder-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UnitOfMeasureService } from '../../unit-of-measure/services/unit-of-measure.service';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../dto/inventory-item/update-inventory-item.dto';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItemPackageService } from '../services/inventory-item-package.service';
import { InventoryItemSizeService } from '../services/inventory-item-size.service';
import { InventoryItemService } from '../services/inventory-item.service';
import { InventoryItemSizeValidator } from '../validators/inventory-item-size.validator';

@Injectable()
export class InventoryItemSizeBuilder extends BuilderBase<InventoryItemSize> {
  constructor(
    @Inject(forwardRef(() => InventoryItemService))
    private readonly itemService: InventoryItemService,

    @Inject(forwardRef(() => InventoryItemSizeService))
    private readonly sizeService: InventoryItemSizeService,

    private readonly packageService: InventoryItemPackageService,
    private readonly unitService: UnitOfMeasureService,

    validator: InventoryItemSizeValidator,
    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      InventoryItemSize,
      'InventoryItemSizeBuilder',
      requestContextService,
      logger,
      validator,
    );
  }

  protected createEntity(dto: CreateInventoryItemSizeDto): void {
    if (dto.inventoryItemId !== undefined) {
      this.InventoryItemById(dto.inventoryItemId);
    }
    if (dto.inventoryPackageId !== undefined) {
      this.packageById(dto.inventoryPackageId);
    }
    if (dto.measureUnitId !== undefined) {
      this.unitOfMeasureById(dto.measureUnitId);
    }
    if (dto.cost !== undefined) {
      this.costByValue(dto.cost);
    }
    {
      this.costByValue(0);
    }
    if (dto.measureAmount !== undefined) {
      this.measureAmount(dto.measureAmount);
    }
  }

  protected updateEntity(dto: UpdateInventoryItemSizeDto): void {
    if (dto.inventoryPackageId !== undefined) {
      this.packageById(dto.inventoryPackageId);
    }
    if (dto.measureUnitId !== undefined) {
      this.unitOfMeasureById(dto.measureUnitId);
    }
    if (dto.cost !== undefined) {
      this.costByValue(dto.cost);
    }
    if (dto.measureAmount !== undefined) {
      this.measureAmount(dto.measureAmount);
    }
  }

  public async buildMany(
    dtos: (CreateInventoryItemSizeDto | NestedUpdateInventoryItemSizeDto)[],
  ): Promise<InventoryItemSize[]> {
    const results: InventoryItemSize[] = [];
    for (const dto of dtos) {
      results.push(await this.buildDto(dto));
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

  public async updateMany(
    dtos: NestedUpdateInventoryItemSizeDto[],
  ): Promise<InventoryItemSize[]> {
    const results: InventoryItemSize[] = [];
    for (const dto of dtos) {
      const size = await this.sizeService.findOne(dto.id, [
        'inventoryItem',
        'measureUnit',
        'packageType',
      ]);
      if (!size) {
        throw new Error('item size not found');
      }
      results.push(await this.buildUpdateDto(size, dto));
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
    dto: CreateInventoryItemSizeDto | NestedUpdateInventoryItemSizeDto,
  ): Promise<InventoryItemSize> {
    if (dto instanceof CreateInventoryItemSizeDto) {
      return await this.buildCreateDto(dto);
    }
    const size = await this.sizeService.findOne(dto.id, [
      'inventoryItem',
      'measureUnit',
      'packageType',
    ]);
    if (!size) {
      throw new Error('item size not found');
    }
    return await this.buildUpdateDto(size, dto);
  }

  public unitOfMeasureById(id: number): this {
    return this.setPropById(
      this.unitService.findOne.bind(this.unitService),
      'measureUnit',
      id,
    );
  }

  public unitOfMeasureByName(name: string): this {
    return this.setPropByName(
      this.unitService.findOneByName.bind(this.unitService),
      'measureUnit',
      name,
    );
  }

  public packageById(id: number): this {
    return this.setPropById(
      this.packageService.findOne.bind(this.packageService),
      'packageType',
      id,
    );
  }

  public packageByName(name: string): this {
    return this.setPropByName(
      this.packageService.findOneByName.bind(this.packageService),
      'packageType',
      name,
    );
  }

  public InventoryItemById(id: number): this {
    return this.setPropById(
      this.itemService.findOne.bind(this.itemService),
      'inventoryItem',
      id,
    );
  }

  public InventoryItemByName(name: string): this {
    return this.setPropByName(
      this.itemService.findOneByName.bind(this.itemService),
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
