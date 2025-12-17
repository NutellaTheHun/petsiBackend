import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemCategoryDto } from '../dto/menu-item-category/create-menu-item-category.dto';
import { UpdateMenuItemCategoryDto } from '../dto/menu-item-category/update-menu-item-category.dto';
import {
  MenuItemCategory,
  MenuItemCategoryEntity,
} from '../entities/menu-item-category.entity';

@Injectable()
export class MenuItemCategoryValidator extends ValidatorBase<MenuItemCategoryEntity> {
  constructor(
    @InjectRepository(MenuItemCategory)
    private readonly repo: Repository<MenuItemCategory>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'MenuItemCategory', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateMenuItemCategoryDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'categoryName',
      results,
      'Item with this name already exists',
      id,
    );

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateMenuItemCategoryDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'categoryName',
        results,
        'Item with this name already exists',
        id,
      );
    }

    return this.checkValidateResult(results);
  }
}
