import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemCategoryDto } from '../dto/menu-item-category/create-menu-item-category.dto';
import { UpdateMenuItemCategoryDto } from '../dto/menu-item-category/update-menu-item-category.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';

@Injectable()
export class MenuItemCategoryValidator extends ValidatorBase<MenuItemCategory> {
  constructor(
    @InjectRepository(MenuItemCategory)
    private readonly repo: Repository<MenuItemCategory>,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'MenuItemCategory', requestContextService, logger);
  }

  public async validateCreate(
    createId: string,
    dto: CreateMenuItemCategoryDto,
  ): Promise<void> {
    if (await this.helper.exists(this.repo, 'categoryName', dto.categoryName)) {
      this.addError(
        this.buildValidationError(
          'categoryName',
          'Menu category name already exists.',
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
    dto: UpdateMenuItemCategoryDto,
  ): Promise<void> {
    if (dto.categoryName) {
      if (
        await this.helper.exists(this.repo, 'categoryName', dto.categoryName)
      ) {
        this.addError(
          this.buildValidationError(
            'categoryName',
            'Menu category name already exists.',
            'EXIST',
            id,
          ),
        );
      }
    }

    this.throwIfErrors();
  }
}
