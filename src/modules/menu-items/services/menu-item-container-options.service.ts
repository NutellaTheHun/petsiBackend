import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { MenuItemContainerOptionsBuilder } from '../builders/menu-item-container-options.builder';
import { CreateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/create-menu-item-container-options.dto';
import { UpdateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/update-menu-item-container-options.dto';
import {
  MenuItemContainerOptions,
  MenuItemContainerOptionsEntity,
} from '../entities/menu-item-container-options.entity';
import { MenuItemContainerOptionsValidator } from '../validators/menu-item-container-options.validator';

/**
 * pending depreciation
 */
@Injectable()
export class MenuItemContainerOptionsService extends ServiceBase<MenuItemContainerOptionsEntity> {
  constructor(
    @InjectRepository(MenuItemContainerOptions)
    repo: Repository<MenuItemContainerOptions>,

    @Inject(forwardRef(() => MenuItemContainerOptionsBuilder))
    builder: MenuItemContainerOptionsBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: MenuItemContainerOptionsValidator,
  ) {
    super(
      repo,
      builder,
      'MenuItemContainerOptionsService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateMenuItemContainerOptionsDto,
    manager: EntityManager,
  ): Promise<MenuItemContainerOptions> {
    const result = manager.create(MenuItemContainerOptions, {});
    return result;
  }

  protected async updateEntity(
    dto: UpdateMenuItemContainerOptionsDto,
    manager: EntityManager,
    entity: MenuItemContainerOptions,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
