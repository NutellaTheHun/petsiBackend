import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { TemplateMenuItemBuilder } from '../builders/template-menu-item.builder';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';
import {
  TemplateMenuItem,
  TemplateMenuItemEntity,
} from '../entities/template-menu-item.entity';
import { TemplateMenuItemCreateInTransaction } from '../utils/transactions/template-menu-item.create.transaction';
import { TemplateMenuItemUpdateInTransaction } from '../utils/transactions/template-menu-item.update.transaction';
import { TemplateMenuItemValidator } from '../validators/template-menu-item.validator';

@Injectable()
export class TemplateMenuItemService extends ServiceBase<TemplateMenuItemEntity> {
  constructor(
    @InjectRepository(TemplateMenuItem)
    repo: Repository<TemplateMenuItem>,

    @Inject(forwardRef(() => TemplateMenuItemBuilder))
    builder: TemplateMenuItemBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: TemplateMenuItemValidator,
  ) {
    super(
      repo,
      builder,
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
    return await TemplateMenuItemCreateInTransaction(dto, manager);
  }

  protected async updateEntity(
    dto: UpdateTemplateMenuItemDto,
    manager: EntityManager,
    entity: TemplateMenuItem,
  ): Promise<void> {
    await TemplateMenuItemUpdateInTransaction(dto, manager, entity);
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
