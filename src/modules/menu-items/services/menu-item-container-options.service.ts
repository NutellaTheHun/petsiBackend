import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { MenuItemContainerOptionsBuilder } from '../builders/menu-item-container-options.builder';
import {
  MenuItemContainerOptions,
  MenuItemContainerOptionsEntity,
} from '../entities/menu-item-container-options.entity';
import { MenuItemContainerOptionsValidator } from '../validators/menu-item-container-options.validator';

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
}
