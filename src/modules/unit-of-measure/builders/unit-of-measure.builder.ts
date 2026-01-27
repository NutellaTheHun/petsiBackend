import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateUnitOfMeasureDto } from '../dto/unit-of-measure/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from '../dto/unit-of-measure/update-unit-of-measure.dto';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';

@Injectable()
export class UnitOfMeasureBuilder extends BuilderBase<UnitOfMeasure> {
  constructor(
    @InjectRepository(UnitOfMeasureCategory)
    private readonly categoryRepo: Repository<UnitOfMeasureCategory>,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(UnitOfMeasure, 'UnitOfMeasureBuilder', requestContextService, logger);
  }

  protected createEntity(dto: CreateUnitOfMeasureDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
    if (dto.abbreviation !== undefined) {
      this.abbreviation(dto.abbreviation);
    }
    if (dto.conversionFactorToBase !== undefined) {
      this.conversionFactor(dto.conversionFactorToBase);
    }
    if (dto.categoryId !== undefined) {
      this.categoryById(dto.categoryId);
    }
  }

  protected updateEntity(dto: UpdateUnitOfMeasureDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
    if (dto.abbreviation !== undefined) {
      this.abbreviation(dto.abbreviation);
    }
    if (dto.conversionFactorToBase !== undefined) {
      this.conversionFactor(dto.conversionFactorToBase);
    }
    if (dto.categoryId !== undefined) {
      this.categoryById(dto.categoryId);
    }
  }

  public name(name: string): this {
    return this.setPropByVal('name', name);
  }

  public abbreviation(abr: string): this {
    return this.setPropByVal('abbreviation', abr);
  }

  public categoryById(id: number | null): this {
    if (id === null) {
      return this.setPropByVal('category', null);
    }
    return this.setPropById(
      async (id: number) => await this.categoryRepo.findOne({ where: { id } }),
      'category',
      id,
    );
  }

  public categoryByName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.categoryRepo.findOne({ where: { name } }),
      'category',
      name,
    );
  }

  public conversionFactor(value: string): this {
    return this.setPropByVal('conversionFactorToBase', value);
  }
}
