import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { TemplateBuilder } from '../builders/template.builder';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template, TemplateEntity } from '../entities/template.entity';
import { TemplateMenuItemComposer } from '../utils/transactions/template-menu-item.composer';
import { TemplateValidator } from '../validators/template.validator';

@Injectable()
export class TemplateService extends ServiceBase<TemplateEntity> {
  constructor(
    @InjectRepository(Template)
    private readonly repo: Repository<Template>,

    builder: TemplateBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: TemplateValidator,
    private readonly tempalateItemComposer: TemplateMenuItemComposer,
  ) {
    super(
      repo,
      builder,
      'TemplateService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateTemplateDto,
    manager: EntityManager,
  ): Promise<Template> {
    const entity = manager.create(Template, {
      templateName: dto.name,
      isPie: dto.isPie,
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
    if (dto.isPie !== undefined) {
      entity.isPie = dto.isPie;
    }

    if (dto.name !== undefined) {
      entity.name = dto.name;
    }

    if (dto.templateMenuItems) {
      const existingItems = await manager.find(TemplateMenuItem, {
        where: { parentTemplate: { id: entity.id } },
      });
      entity.templateMenuItems =
        await this.tempalateItemComposer.composeManyNestedEntity(
          dto.templateMenuItems,
          manager,
          existingItems,
          { parentTemplateId: entity.id },
        );
    }

    await manager.save(entity);
  }

  async findOneByName(
    name: string,
    relations?: Array<keyof Template>,
  ): Promise<Template | null> {
    return await this.repo.findOne({
      where: { name: name },
      relations: relations,
    });
  }

  protected applySearch(
    query: SelectQueryBuilder<Template>,
    search: string,
  ): void {
    query.andWhere('(LOWER(entity.templateName) LIKE :search)', {
      search: `%${search.toLowerCase()}%`,
    });
  }

  protected applySortBy(
    query: SelectQueryBuilder<Template>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'templateName') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
