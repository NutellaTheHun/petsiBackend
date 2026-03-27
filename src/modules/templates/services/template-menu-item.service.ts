import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ChangeDetectorBase } from '../../../common/base/change-detector.base';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';
import {
    TemplateMenuItem,
    TemplateMenuItemEntity,
} from '../entities/template-menu-item.entity';
import { TemplateMenuItemComposer } from '../utils/composers/template-menu-item.composer';
import { TemplateMenuItemChangeDetector } from '../utils/change-detectors/template-menu-item.change-detector';
import { TemplateMenuItemValidator } from '../validators/template-menu-item.validator';

@Injectable()
export class TemplateMenuItemService extends ServiceBase<TemplateMenuItemEntity> {
    constructor(
        @InjectRepository(TemplateMenuItem)
        repo: Repository<TemplateMenuItem>,
        requestContextService: RequestContextService,
        logger: AppLogger,
        validator: TemplateMenuItemValidator,

        private readonly templateItemComposer: TemplateMenuItemComposer,
        private readonly templateMenuItemChangeDetector: TemplateMenuItemChangeDetector,
    ) {
        super(
            repo,
            'TemplateMenuItemService',
            requestContextService,
            logger,
            validator,
        );
    }

    protected async createEntity(
        dto: CreateTemplateMenuItemDto,
        manager: EntityManager,
    ): Promise<TemplateMenuItem> {
        return await manager.save(
            await this.templateItemComposer.composeCreate(dto, manager),
        );
    }

    protected async updateEntity(
        dto: UpdateTemplateMenuItemDto,
        manager: EntityManager,
        entity: TemplateMenuItem,
    ): Promise<void> {
        await this.templateItemComposer.composeUpdate(dto, manager, entity)
        await manager.save(entity);
    }

    protected applySortBy(
        query: SelectQueryBuilder<TemplateMenuItem>,
        sortBy: string,
        sortOrder: 'ASC' | 'DESC',
    ): void {
        if (sortBy === 'tablePosIndex') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
    }

    // filter by template
    protected applyFilters(
        query: SelectQueryBuilder<TemplateMenuItem>,
        filters: Record<string, string[]>,
    ): void {
        if (filters.parentTemplate && filters.parentTemplate.length > 0) {
            query.andWhere('entity.parentTemplate IN (:...parentTemplates)', {
                parentTemplates: filters.parentTemplate,
            });
        }
    }

    protected getChangeDetector():
        | ChangeDetectorBase<TemplateMenuItem, UpdateTemplateMenuItemDto>
        | undefined {
        return this.templateMenuItemChangeDetector as unknown as ChangeDetectorBase<
            TemplateMenuItem,
            UpdateTemplateMenuItemDto
        >;
    }
}
