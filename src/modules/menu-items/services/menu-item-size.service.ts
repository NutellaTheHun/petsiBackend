import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { MenuItemSizeBuilder } from '../builders/menu-item-size.builder';
import {
  MenuItemSize,
  MenuItemSizeEntity,
} from '../entities/menu-item-size.entity';
import { MenuItemSizeValidator } from '../validators/menu-item-size.validator';

@Injectable()
export class MenuItemSizeService extends ServiceBase<MenuItemSizeEntity> {
  constructor(
    @InjectRepository(MenuItemSize)
    private readonly repo: Repository<MenuItemSize>,

    builder: MenuItemSizeBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: MenuItemSizeValidator,
  ) {
    super(
      repo,
      builder,
      'MenuItemSizeService',
      requestContextService,
      logger,
      validator,
    );
  }

  async findOneByName(
    name: string,
    relations?: Array<keyof MenuItemSize>,
  ): Promise<MenuItemSize | null> {
    return await this.repo.findOne({ where: { name: name }, relations });
  }

  protected applySortBy(
    query: SelectQueryBuilder<MenuItemSize>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'name') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
