import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UnitOfMeasureCategoryBuilder } from '../builders/unit-of-measure-category.builder';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';

@Injectable()
export class UnitOfMeasureCategoryService extends ServiceBase<UnitOfMeasureCategory> {
    constructor(
        @InjectRepository(UnitOfMeasureCategory)
        private readonly repo: Repository<UnitOfMeasureCategory>,

        @Inject(forwardRef(() => UnitOfMeasureCategoryBuilder))
        builder: UnitOfMeasureCategoryBuilder,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'UnitCategoryService', requestContextService, logger); }

    async findOneByName(categoryName: string, relations?: Array<keyof UnitOfMeasureCategory>): Promise<UnitOfMeasureCategory | null> {
        return this.repo.findOne({ where: { categoryName: categoryName }, relations });
    }

    protected applySortBy(query: SelectQueryBuilder<UnitOfMeasureCategory>, sortBy: string, sortOrder: "ASC" | "DESC"): void {
        if (sortBy === 'categoryName') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
    }
}