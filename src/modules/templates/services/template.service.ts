import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { TemplateBuilder } from '../builders/template.builder';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template, TemplateEntity } from '../entities/template.entity';
import { TemplateMenuItemCreateInTransaction } from '../utils/transactions/template-menu-item.create.transaction';
import { TemplateMenuItemUpdateInTransaction } from '../utils/transactions/template-menu-item.update.transaction';
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
    let templateItems: TemplateMenuItem[] = [];
    if (dto.templateMenuItemDtos) {
      for (const nestedDto of dto.templateMenuItemDtos) {
        if (nestedDto.createDto) {
          const newTemplateItem = await TemplateMenuItemCreateInTransaction(
            nestedDto.createDto,
            manager,
          );
          templateItems.push(newTemplateItem);
        } else {
          throw new Error(
            'Create Template: nested TemplateMenuItem dto is missing create dto',
          );
        }
      }
    }

    const result = manager.create(Template, {
      templateName: dto.name,
      isPie: dto.isPie,
      templateItems,
    });

    return result;
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

    if (dto.templateMenuItemDtos) {
      const existingItems = await manager.find(TemplateMenuItem, {
        where: { parentTemplate: { id: entity.id } },
      });
      const existingMap = new Map(existingItems.map((i) => [i.id, i]));

      for (const nestedDto of dto.templateMenuItemDtos) {
        if (nestedDto.createDto) {
          const newTemplateItem = await TemplateMenuItemCreateInTransaction(
            nestedDto.createDto,
            manager,
          );
          existingMap.set(newTemplateItem.id, newTemplateItem);
        } else if (nestedDto.updateDto && nestedDto.id) {
          const toUpdate = existingMap.get(nestedDto.id);
          if (!toUpdate) {
            throw new Error(
              `Update Template: templateMenuItem to update with id ${nestedDto.id} not found`,
            );
          }
          await TemplateMenuItemUpdateInTransaction(
            nestedDto.updateDto,
            manager,
            toUpdate,
          );
        } else {
          throw new Error(
            'Update Template: nested templateMenuItem dto has neither createDto or updateDto with ID',
          );
        }
      }
      entity.templateMenuItems = Array.from(existingMap.values());
    }
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
