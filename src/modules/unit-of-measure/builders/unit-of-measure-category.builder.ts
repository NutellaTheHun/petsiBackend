import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/create-unit-of-measure-category.dto';
import { UpdateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/update-unit-of-measure-category.dto';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';

@Injectable()
export class UnitOfMeasureCategoryBuilder extends BuilderBase<UnitOfMeasureCategory> {
  constructor(
    @InjectRepository(UnitOfMeasure)
    private readonly unitRepo: Repository<UnitOfMeasure>,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      UnitOfMeasureCategory,
      'UnitCategoryBuilder',
      requestContextService,
      logger,
    );
  }

  protected createEntity(dto: CreateUnitOfMeasureCategoryDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
    if (dto.baseConversionUnitId !== undefined) {
      this.baseConversionUnitById(dto.baseConversionUnitId);
    }
  }

  protected updateEntity(dto: UpdateUnitOfMeasureCategoryDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
    if (dto.baseConversionUnitId !== undefined) {
      this.baseConversionUnitById(dto.baseConversionUnitId);
    }
  }

  public name(name: string): this {
    return this.setPropByVal('name', name);
  }

  public unitsOfMeasureById(ids: number[]): this {
    return this.setPropsByIds(
      async (ids: number[]) =>
        await this.unitRepo.find({ where: { id: In(ids) } }),
      'units',
      ids,
    );
  }

  public baseConversionUnitById(id: number | null): this {
    if (id === null) {
      return this.setPropByVal('baseConversionUnit', null);
    }
    return this.setPropById(
      async (id: number) => await this.unitRepo.findOne({ where: { id } }),
      'baseConversionUnit',
      id,
    );
  }

  public async baseConversionUnitByName(name: string): Promise<this> {
    return this.setPropByName(
      async (name: string) => await this.unitRepo.findOne({ where: { name } }),
      'baseConversionUnit',
      name,
    );
  }
}
