import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Big from "big.js";
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UnitOfMeasureBuilder } from '../builders/unit-of-measure.builder';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';

@Injectable()
export class UnitOfMeasureService extends ServiceBase<UnitOfMeasure> {
    constructor(
        @InjectRepository(UnitOfMeasure)
        private readonly repo: Repository<UnitOfMeasure>,

        @Inject(forwardRef(() => UnitOfMeasureBuilder))
        builder: UnitOfMeasureBuilder,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'UnitOfMeasureService', requestContextService, logger); }

    async findOneByName(unitName: string, relations?: Array<keyof UnitOfMeasure>): Promise<UnitOfMeasure | null> {
        return await this.repo.findOne({ where: { name: unitName }, relations });
    }

    convert(unitAmount: Big, inputUnitType: UnitOfMeasure, outputUnitType: UnitOfMeasure): Big {
        if (!inputUnitType.conversionFactorToBase || !outputUnitType.conversionFactorToBase) {
            throw new Error("Both units must have conversion factors to base.");
        }

        if (inputUnitType.category?.id !== outputUnitType.category?.id) {
            throw new Error("Both units must be in the same category to convert.");
        }

        const baseAmount = new Big(unitAmount).times(new Big(inputUnitType.conversionFactorToBase));
        const targetAmount = baseAmount.div(new Big(outputUnitType.conversionFactorToBase));

        return targetAmount;
    }

    protected applySearch(query: SelectQueryBuilder<UnitOfMeasure>, search: string): void {
        query.andWhere(
            '(LOWER(entity.name) LIKE :search)', { search: `%${search.toLowerCase()}%` }
        );
    }

    protected applyFilters(query: SelectQueryBuilder<UnitOfMeasure>, filters: Record<string, string>): void {
        if (filters.category) {
            query.andWhere('entity.category = :category', { category: filters.category });
        }
    }

    protected applySortBy(query: SelectQueryBuilder<UnitOfMeasure>, sortBy: string, sortOrder: "ASC" | "DESC"): void {
        if (sortBy === 'name') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
        if (sortBy === 'category') {
            query.leftJoinAndSelect('entity.category', 'category');
            query.orderBy('category.categoryName', sortOrder, 'NULLS LAST');
        }
        // category name
    }
}