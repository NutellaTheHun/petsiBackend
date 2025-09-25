import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemSizeDto } from '../dto/menu-item-size/create-menu-item-size.dto';
import { UpdateMenuItemSizeDto } from '../dto/menu-item-size/update-menu-item-size.dto';
import { MenuItemSize } from '../entities/menu-item-size.entity';

@Injectable()
export class MenuItemSizeValidator extends ValidatorBase<MenuItemSize> {
  constructor(
    @InjectRepository(MenuItemSize)
    private readonly repo: Repository<MenuItemSize>,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'MenuItemSize', requestContextService, logger);
  }

  public async validateCreate(
    createId: string,
    dto: CreateMenuItemSizeDto,
  ): Promise<void> {
    // exists
    if (await this.helper.exists(this.repo, 'name', dto.sizeName)) {
      this.addError(
        this.buildValidationError(
          'name',
          'Menu item size already exists.',
          'EXIST',
          undefined,
          createId,
        ),
      );
    }

    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    dto: UpdateMenuItemSizeDto,
  ): Promise<void> {
    // exists
    if (dto.sizeName) {
      if (await this.helper.exists(this.repo, 'name', dto.sizeName)) {
        this.addError(
          this.buildValidationError(
            'name',
            'Menu item size already exists.',
            'EXIST',
            id,
          ),
        );
      }
    }

    this.throwIfErrors();
  }
}
