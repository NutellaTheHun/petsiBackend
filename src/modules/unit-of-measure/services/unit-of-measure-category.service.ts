import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UnitOfMeasureCategoryBuilder } from '../builders/unit-of-measure-category.builder';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import { UnitOfMeasureCategoryValidator } from '../validators/unit-of-measure-category.validator';

@Injectable()
export class UnitOfMeasureCategoryService extends ServiceBase<UnitOfMeasureCategory> {
  constructor(
    @InjectRepository(UnitOfMeasureCategory)
    private readonly categoryRepo: Repository<UnitOfMeasureCategory>,

    @Inject(forwardRef(() => UnitOfMeasureCategoryBuilder))
    categoryBuilder: UnitOfMeasureCategoryBuilder,

  validator: UnitOfMeasureCategoryValidator,

    requestContextService: RequestContextService,

    logger: AppLogger,
  ){ super( categoryRepo, categoryBuilder, validator, 'UnitCategoryService', requestContextService, logger); }

  async findOneByName(categoryName: string, relations?: Array<keyof UnitOfMeasureCategory>): Promise<UnitOfMeasureCategory | null> {
    return this.categoryRepo.findOne({ where: { name: categoryName }, relations });
  }
}