import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemSizeDto } from '../dto/menu-item-size/create-menu-item-size.dto';
import { UpdateMenuItemSizeDto } from '../dto/menu-item-size/update-menu-item-size.dto';
import {
  MenuItemSize,
  MenuItemSizeEntity,
} from '../entities/menu-item-size.entity';

@Injectable()
export class MenuItemSizeValidator extends ValidatorBase<MenuItemSizeEntity> {
  constructor(
    @InjectRepository(MenuItemSize)
    private readonly repo: Repository<MenuItemSize>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'MenuItemSize', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateMenuItemSizeDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // exists
    if (await this.helper.exists(this.repo, 'name', dto.sizeName)) {
      const err = new ValidationErrorNode(
        'name',
        id,
        'Menu item size already exists.',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateMenuItemSizeDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.sizeName) {
      if (await this.helper.exists(this.repo, 'name', dto.sizeName)) {
        const err = new ValidationErrorNode(
          'name',
          id,
          'Menu item size already exists.',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }
}
