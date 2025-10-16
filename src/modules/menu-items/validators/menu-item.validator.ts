import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItem, MenuItemEntity } from '../entities/menu-item.entity';
import { MenuItemContainerItemService } from '../services/menu-item-container-item.service';
import { MenuItemService } from '../services/menu-item.service';
import { MenuItemContainerItemValidator } from './menu-item-container-item.validator';
import { MenuItemContainerOptionsValidator } from './menu-item-container-options.validator';

@Injectable()
export class MenuItemValidator extends ValidatorBase<MenuItemEntity> {
  constructor(
    @InjectRepository(MenuItem)
    private readonly repo: Repository<MenuItem>,

    @Inject(forwardRef(() => MenuItemContainerItemService))
    private readonly containerService: MenuItemContainerItemService,

    @Inject(forwardRef(() => MenuItemService))
    private readonly itemService: MenuItemService,
    logger: AppLogger,
    requestContextService: RequestContextService,
    private readonly menuItemContainerValidator: MenuItemContainerItemValidator,
    private readonly menuItemContainerOptionValidator: MenuItemContainerOptionsValidator,
  ) {
    super(repo, 'MenuItem', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateMenuItemDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // exists
    if (await this.helper.exists(this.repo, 'itemName', dto.itemName)) {
      const err = new ValidationErrorNode(
        'itemName',
        id,
        'Menu item already exists.',
      );
      results.push(err);
    }

    if (
      dto.definedContainerItemDtos &&
      dto.definedContainerItemDtos.length > 0
    ) {
      const nestedDtoErr =
        await this.menuItemContainerValidator.validateManyNestedNode(
          'definedContainerItems',
          dto.definedContainerItemDtos,
        );
      if (nestedDtoErr) {
        results.push(nestedDtoErr);
      }
    }

    if (dto.containerOptionDto) {
      const nestedDtoErr =
        await this.menuItemContainerOptionValidator.validateNestedNode(
          'containerOptions',
          dto.containerOptionDto,
        );
      if (nestedDtoErr) {
        results.push(nestedDtoErr);
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateMenuItemDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Cannot change name to another existing item
    if (dto.itemName) {
      if (await this.helper.exists(this.repo, 'itemName', dto.itemName)) {
        const err = new ValidationErrorNode(
          'itemName',
          id,
          'Menu item already exists.',
        );
        results.push(err);
      }
    }

    if (
      dto.definedContainerItemDtos &&
      dto.definedContainerItemDtos.length > 0
    ) {
      const nestedDtoErr =
        await this.menuItemContainerValidator.validateManyNestedNode(
          'definedContainerItems',
          dto.definedContainerItemDtos,
        );
      if (nestedDtoErr) {
        results.push(nestedDtoErr);
      }
    }

    if (dto.containerOptionDto) {
      const nestedDtoErr =
        await this.menuItemContainerOptionValidator.validateNestedNode(
          'containerOptions',
          dto.containerOptionDto,
        );
      if (nestedDtoErr) {
        results.push(nestedDtoErr);
      }
    }

    return this.checkValidateResult(results);
  }
}
