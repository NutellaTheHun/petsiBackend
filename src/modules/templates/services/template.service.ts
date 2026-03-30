import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ChangeDetectorBase } from '../../../common/base/change-detector.base';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { Template, TemplateEntity } from '../entities/template.entity';
import { TemplateChangeDetector } from '../utils/change-detectors/template.change-detector';
import { TemplateMenuItemComposer } from '../utils/composers/template-menu-item.composer';
import { TemplateValidator } from '../validators/template.validator';

@Injectable()
export class TemplateService extends ServiceBase<TemplateEntity> {
    constructor(
        @InjectRepository(Template)
        repo: Repository<Template>,
        requestContextService: RequestContextService,
        logger: AppLogger,
        validator: TemplateValidator,

        private readonly tempalateItemComposer: TemplateMenuItemComposer,
        private readonly templateChangeDetector: TemplateChangeDetector,
    ) {
        super(repo, 'TemplateService', requestContextService, logger, validator);
    }

    protected async createEntity(
        dto: CreateTemplateDto,
        manager: EntityManager,
    ): Promise<Template> {
        const entity = manager.create(Template, {
            name: dto.name,
        });

        const savedEntity = await manager.save(entity);

        if (dto.templateMenuItems?.length) {
            savedEntity.templateMenuItems =
                await this.tempalateItemComposer.composeManyNestedEntity(
                    dto.templateMenuItems,
                    manager,
                    [],
                    { parentTemplateId: savedEntity.id },
                );
            await manager.save(savedEntity);
        }

        return savedEntity;
    }

    protected async updateEntity(
        dto: UpdateTemplateDto,
        manager: EntityManager,
        entity: Template,
    ): Promise<void> {
        if (dto.name !== undefined) {
            entity.name = dto.name;
        }

        if (dto.templateMenuItems) {
            entity.templateMenuItems =
                await this.tempalateItemComposer.composeManyNestedEntity(
                    dto.templateMenuItems,
                    manager,
                    entity.templateMenuItems ?? [],
                    { parentTemplateId: entity.id },
                );
        }

        await manager.save(entity);
    }

    protected applySearch(
        query: SelectQueryBuilder<Template>,
        search: string,
    ): void {
        query.andWhere('(LOWER(entity.name) LIKE :search)', {
            search: `%${search.toLowerCase()}%`,
        });
    }

    protected applySortBy(
        query: SelectQueryBuilder<Template>,
        sortBy: string,
        sortOrder: 'ASC' | 'DESC',
    ): void {
        if (sortBy === 'name') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
    }

    protected getChangeDetector(): ChangeDetectorBase<Template, UpdateTemplateDto> | undefined {
        return this.templateChangeDetector;
    }

    protected getUpdateDiffRelations(): string[] {
        return ['templateMenuItems', 'templateMenuItems.menuItem'];
    }
}
