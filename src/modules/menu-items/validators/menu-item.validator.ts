import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItem, MenuItemEntity } from '../entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemContainerItemValidator } from './menu-item-container-item.validator';
import { MenuItemContainerItemPatchValidator } from './patch-validators/menu-item.patch.validator';

@Injectable()
export class MenuItemValidator extends ValidatorBase<MenuItemEntity> {
  constructor(
    @InjectRepository(MenuItem)
    private readonly repo: Repository<MenuItem>,

    private readonly menuItemContainerValidator: MenuItemContainerItemValidator,

    @InjectRepository(MenuItemContainerItem)
    private readonly menuItemContainerItemRepo: Repository<MenuItemContainerItem>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'MenuItem', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateMenuItemDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // name must be unique
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      results,
      'Menu item already exists.',
      id,
    );

    if (dto.containerMenuItems?.length) {
      if (dto.type !== MENU_ITEM_TYPES.CONTAINER) {
        const err = new ValidationErrorNode(
          'type',
          id,
          'item has contained items but is not set to type container',
        );
        results.push(err);
      }

      // validate no duplicates
      const miciValidator = new MenuItemContainerItemPatchValidator(
        dto.containerMenuItems,
      );

      miciValidator.validateUnique(
        'containerMenuItems',
        results,
        'duplicate container item',
        id,
      );

      // nested validator call
      const nestedDtoErr =
        await this.menuItemContainerValidator.validateManyNestedNode(
          'containerMenuItems',
          dto.containerMenuItems,
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

    // exists
    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        results,
        'Menu item already exists.',
        id,
      );
    }

    // containerItem dtos
    if (dto.containerMenuItems?.length) {
      if (dto.type !== MENU_ITEM_TYPES.CONTAINER) {
        const err = new ValidationErrorNode(
          'type',
          id,
          'item has contained items but is not set to type container',
        );
        results.push(err);
      }

      // validate no duplicates

      // Get current container items
      const currentContainerItems = await this.menuItemContainerItemRepo.find({
        where: { parentMenuItem: { id } },
        relations: ['containedMenuItem', 'containedItemSize'],
      });
      if (!currentContainerItems) {
        throw new NotFoundException();
      }

      const miciValidator = new MenuItemContainerItemPatchValidator(
        dto.containerMenuItems,
        currentContainerItems,
      );

      miciValidator.validateUnique(
        'containerMenuItems',
        results,
        'duplicate container item',
        id,
      );

      // nested validator call
      const nestedDtoErr =
        await this.menuItemContainerValidator.validateManyNestedNode(
          'containerMenuItems',
          dto.containerMenuItems,
        );
      if (nestedDtoErr) {
        results.push(nestedDtoErr);
      }
    }

    return this.checkValidateResult(results);
  }
}
