import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Big from 'big.js';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateUnitOfMeasureDto } from '../dto/unit-of-measure/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from '../dto/unit-of-measure/update-unit-of-measure.dto';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import {
  UnitOfMeasure,
  UnitOfMeasureEntity,
} from '../entities/unit-of-measure.entity';
import { UnitOfMeasureValidator } from '../validators/unit-of-measure.validator';

@Injectable()
export class UnitOfMeasureService extends ServiceBase<UnitOfMeasureEntity> {
  constructor(
    @InjectRepository(UnitOfMeasure)
    repo: Repository<UnitOfMeasure>,
    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: UnitOfMeasureValidator,
  ) {
    super(
      repo,
      'UnitOfMeasureService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateUnitOfMeasureDto,
    manager: EntityManager,
  ): Promise<UnitOfMeasure> {
    const result = manager.create(UnitOfMeasure, {
      name: dto.name,
      abbreviation: dto.abbreviation,
      category: dto.categoryId ? { id: dto.categoryId } : null,
      conversionFactorToBase: dto.conversionFactorToBase,
    });

    return await manager.save(result);
  }

  protected async updateEntity(
    dto: UpdateUnitOfMeasureDto,
    manager: EntityManager,
    entity: UnitOfMeasure,
  ): Promise<void> {
    if (dto.abbreviation !== undefined) {
      entity.abbreviation = dto.abbreviation;
    }

    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        entity.category = null;
      } else {
        entity.category = manager.create(UnitOfMeasureCategory, {
          id: dto.categoryId,
        });
      }
    }

    if (dto.conversionFactorToBase !== undefined) {
      entity.conversionFactorToBase = dto.conversionFactorToBase;
    }

    if (dto.name !== undefined) {
      entity.name = dto.name;
    }

    await manager.save(entity);
  }

  convert(
    unitAmount: Big,
    inputUnitType: UnitOfMeasure,
    outputUnitType: UnitOfMeasure,
  ): Big {
    if (
      !inputUnitType.conversionFactorToBase ||
      !outputUnitType.conversionFactorToBase
    ) {
      throw new Error('Both units must have conversion factors to base.');
    }

    if (inputUnitType.category?.id !== outputUnitType.category?.id) {
      throw new Error('Both units must be in the same category to convert.');
    }

    const baseAmount = new Big(unitAmount).times(
      new Big(inputUnitType.conversionFactorToBase),
    );
    const targetAmount = baseAmount.div(
      new Big(outputUnitType.conversionFactorToBase),
    );

    return targetAmount;
  }

  protected applySearch(
    query: SelectQueryBuilder<UnitOfMeasure>,
    search: string,
  ): void {
    query.andWhere('(LOWER(entity.name) LIKE :search)', {
      search: `%${search.toLowerCase()}%`,
    });
  }

  protected applyFilters(
    query: SelectQueryBuilder<UnitOfMeasure>,
    filters: Record<string, string[]>,
  ): void {
    if (filters.category && filters.category.length > 0) {
      query.andWhere('entity.category IN (:...categories)', {
        categories: filters.category,
      });
    }
  }

  protected applySortBy(
    query: SelectQueryBuilder<UnitOfMeasure>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'name') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
    if (sortBy === 'category') {
      query.leftJoinAndSelect('entity.category', 'category');
      query.orderBy('category.name', sortOrder, 'NULLS LAST');
    }
  }
}
