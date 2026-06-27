import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateDynamicPropertyConfigDto } from '../dto/dynamic-property-config/create-dynamic-property-config.dto';
import { UpdateDynamicPropertyConfigDto } from '../dto/dynamic-property-config/update-dynamic-property-config.dto';
import {
    DynamicPropertyConfig,
    DynamicPropertyConfigEntity,
    deriveFieldRenderType,
} from '../entities/dynamic-property-config.entity';
import { DynamicPropertyConfigValidator } from '../validators/dynamic-property-config.validator';

@Injectable()
export class DynamicPropertyConfigService extends ServiceBase<DynamicPropertyConfigEntity> {
    constructor(
        @InjectRepository(DynamicPropertyConfig)
        repo: Repository<DynamicPropertyConfig>,
        requestContextService: RequestContextService,
        logger: AppLogger,
        validator: DynamicPropertyConfigValidator,
    ) {
        super(repo, 'DynamicPropertyConfigService', requestContextService, logger, validator);
    }

    protected async createEntity(
        dto: CreateDynamicPropertyConfigDto,
        manager: EntityManager,
    ): Promise<DynamicPropertyConfig> {
        const holderCategory =
            dto.holderCategoryId != null
                ? await manager.findOne(MenuItemCategory, { where: { id: dto.holderCategoryId } })
                : null;

        const valueEntityCategory =
            dto.valueEntityCategoryId != null
                ? await manager.findOne(MenuItemCategory, { where: { id: dto.valueEntityCategoryId } })
                : null;

        const entity = manager.create(DynamicPropertyConfig, {
            holderEntityType: dto.holderEntityType,
            holderCategory: holderCategory ?? null,
            propertyName: dto.propertyName,
            valueType: dto.valueType,
            valueEntityType: dto.valueEntityType ?? null,
            valueEntityCategory: valueEntityCategory ?? null,
        });

        const saved = await manager.save(entity);
        saved.fieldRenderType = deriveFieldRenderType(saved.valueType);
        return saved;
    }

    protected async updateEntity(
        dto: UpdateDynamicPropertyConfigDto,
        manager: EntityManager,
        entity: DynamicPropertyConfig,
    ): Promise<void> {
        if (dto.holderEntityType !== undefined) {
            entity.holderEntityType = dto.holderEntityType;
        }

        if (dto.holderCategoryId !== undefined) {
            entity.holderCategory =
                dto.holderCategoryId != null
                    ? await manager.findOne(MenuItemCategory, { where: { id: dto.holderCategoryId } })
                    : null;
        }

        if (dto.propertyName !== undefined) {
            entity.propertyName = dto.propertyName;
        }

        if (dto.valueType !== undefined) {
            entity.valueType = dto.valueType;
        }

        if ('valueEntityType' in dto) {
            entity.valueEntityType = dto.valueEntityType ?? null;
        }

        if (dto.valueEntityCategoryId !== undefined) {
            entity.valueEntityCategory =
                dto.valueEntityCategoryId != null
                    ? await manager.findOne(MenuItemCategory, { where: { id: dto.valueEntityCategoryId } })
                    : null;
        }

        await manager.save(entity);
    }

    protected applySortBy(
        query: SelectQueryBuilder<DynamicPropertyConfig>,
        sortBy: string,
        sortOrder: 'ASC' | 'DESC',
    ): void {
        if (sortBy === 'propertyName') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
    }
}
