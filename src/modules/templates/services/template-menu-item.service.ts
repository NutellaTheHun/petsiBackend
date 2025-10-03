import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { TemplateMenuItemBuilder } from '../builders/template-menu-item.builder';
import {
  TemplateMenuItem,
  TemplateMenuItemEntity,
} from '../entities/template-menu-item.entity';
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
