import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
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
}
