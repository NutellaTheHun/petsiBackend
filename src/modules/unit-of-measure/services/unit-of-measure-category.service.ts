import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
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
        repo: Repository<UnitOfMeasureCategory>,
        requestContextService: RequestContextService,
        logger: AppLogger,
        validator: UnitOfMeasureCategoryValidator,
    ) {
        super(
            repo,
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
            name: dto.name,
            baseConversionUnit: dto.baseConversionUnitId
                ? { id: dto.baseConversionUnitId }
                : null,
        });
        return await manager.save(result);
    }

    protected async updateEntity(
        dto: UpdateUnitOfMeasureCategoryDto,
        manager: EntityManager,
        entity: UnitOfMeasureCategory,
    ): Promise<void> {
        if (dto.baseConversionUnitId !== undefined) {
            if (dto.baseConversionUnitId === null) {
                entity.baseConversionUnit = null;
            } else {
                entity.baseConversionUnit = manager.create(UnitOfMeasure, {
                    id: dto.baseConversionUnitId,
                });
            }
        }

        if (dto.name !== undefined) {
            entity.name = dto.name;
        }
        await manager.save(entity);
    }

    protected applySortBy(
        query: SelectQueryBuilder<UnitOfMeasureCategory>,
        sortBy: string,
        sortOrder: 'ASC' | 'DESC',
    ): void {
        if (sortBy === 'name') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
    }
}
