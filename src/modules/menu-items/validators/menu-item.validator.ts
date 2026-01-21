import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItem, MenuItemEntity } from '../entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemContainerItemAggregateValidator } from './aggregate-validators/menu-item.aggregate.validator';
import { MenuItemContainerItemValidator } from './menu-item-container-item.validator';

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
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // name must be unique
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      errorMap,
      'Menu item already exists.',
    );

    if (dto.containerMenuItems?.length) {
      if (dto.type !== MENU_ITEM_TYPES.CONTAINER) {
        errorMap.addChild(
          'type',
          new ValidationErrorMap(
            undefined,
            'item has contained items but is not set to type container',
          ),
        );
      }

      // validate no duplicates
      const miciValidator = new MenuItemContainerItemAggregateValidator(
        dto.containerMenuItems,
      );

      miciValidator.validateUnique(
        'containerMenuItems',
        errorMap,
        'duplicate container item',
      );

      // nested validator call
      await this.menuItemContainerValidator.validateManyNestedNode(
        'containerMenuItems',
        dto.containerMenuItems,
        errorMap,
      );
    }

    return errorMap;
  }

  protected async doValidateUpdateNode(
    dto: UpdateMenuItemDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // exists
    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        errorMap,
        'Menu item already exists.',
      );
    }

    // containerItem dtos
    if (dto.containerMenuItems?.length) {
      if (dto.type !== MENU_ITEM_TYPES.CONTAINER) {
        // dto.type?
        errorMap.addChild(
          'type',
          new ValidationErrorMap(
            undefined,
            'item has contained items but is not set to type container',
          ),
        );
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

      const miciValidator = new MenuItemContainerItemAggregateValidator(
        dto.containerMenuItems,
        currentContainerItems,
      );

      miciValidator.validateUnique(
        'containerMenuItems',
        errorMap,
        'duplicate container item',
      );

      // nested validator call
      await this.menuItemContainerValidator.validateManyNestedNode(
        'containerMenuItems',
        dto.containerMenuItems,
        errorMap,
      );
    }

    return errorMap;
  }
}
