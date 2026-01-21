import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
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
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      errorMap,
      'Item with this name already exists',
    );

    return errorMap;
  }

  protected async doValidateUpdateNode(
    dto: UpdateMenuItemCategoryDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        errorMap,
        'Item with this name already exists',
      );
    }

    return errorMap;
  }
}
