import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UnitOfMeasureCategoryBuilder } from '../builders/unit-of-measure-category.builder';
import { CreateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/create-unit-of-measure-category.dto';
import { UpdateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/update-unit-of-measure-category.dto';
import {
  UnitOfMeasureCategory,
  UnitOfMeasureCategoryEntity,
} from '../entities/unit-of-measure-category.entity';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { UnitOfMeasureCategoryValidator } from '../validators/unit-of-measure-category.validator';

@Injectable()
export class UnitOfMeasureCategoryService extends ServiceBase<UnitOfMeasureCategoryEntity> {
  constructor(
    @InjectRepository(UnitOfMeasureCategory)
    private readonly repo: Repository<UnitOfMeasureCategory>,

    @Inject(forwardRef(() => UnitOfMeasureCategoryBuilder))
    builder: UnitOfMeasureCategoryBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: UnitOfMeasureCategoryValidator,
  ) {
    super(
      repo,
      builder,
      'UnitCategoryService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateUnitOfMeasureCategoryDto,
    manager: EntityManager,
  ): Promise<UnitOfMeasureCategory> {
    const result = manager.create(UnitOfMeasureCategory, {
      categoryName: dto.categoryName,
      baseConversionUnit: dto.baseUnitId ? { id: dto.baseUnitId } : null,
    });
    return result;
  }

  protected async updateEntity(
    dto: UpdateUnitOfMeasureCategoryDto,
    manager: EntityManager,
    entity: UnitOfMeasureCategory,
  ): Promise<void> {
    if (dto.baseUnitId !== undefined) {
      entity.baseConversionUnit = manager.create(UnitOfMeasure, {
        id: dto.baseUnitId,
      });
    }

    if (dto.categoryName !== undefined) {
      entity.categoryName = dto.categoryName;
    }
  }

  async findOneByName(
    categoryName: string,
    relations?: Array<keyof UnitOfMeasureCategory>,
  ): Promise<UnitOfMeasureCategory | null> {
    return this.repo.findOne({
      where: { categoryName: categoryName },
      relations,
    });
  }

  protected applySortBy(
    query: SelectQueryBuilder<UnitOfMeasureCategory>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'categoryName') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
