import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UnitCategoryBuilder } from '../builders/unit-category.builder';
import { UnitCategory } from '../entities/unit-category.entity';
import { UnitCategoryValidator } from '../validators/unit-category.validator';

@Injectable()
export class UnitCategoryService extends ServiceBase<UnitCategory> {
  constructor(
    @InjectRepository(UnitCategory)
    private readonly categoryRepo: Repository<UnitCategory>,

    @Inject(forwardRef(() => UnitCategoryBuilder))
    categoryBuilder: UnitCategoryBuilder,

  validator: UnitCategoryValidator,

    requestContextService: RequestContextService,

    logger: AppLogger,
  ){ super( categoryRepo, categoryBuilder, validator, 'UnitCategoryService', requestContextService, logger); }

  async findOneByName(categoryName: string, relations?: Array<keyof UnitCategory>): Promise<UnitCategory | null> {
    return this.categoryRepo.findOne({ where: { name: categoryName }, relations });
  }
}