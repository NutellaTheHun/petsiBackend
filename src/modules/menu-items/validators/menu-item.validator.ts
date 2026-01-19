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
      this.helper.enforceNoDuplicateElements(
        dto.containerMenuItems,
        (item) => `${item.containedMenuItemId}:${item.containedItemSizeId}`,
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
      const currentContainerItemsMap = new Map<
        string | number,
        { containedMenuItemId: number; containedItemSizeId: number }
      >();

      // add current container items to map
      for (const item of currentContainerItems) {
        currentContainerItemsMap.set(item.id, {
          containedMenuItemId: item.containedMenuItem.id,
          containedItemSizeId: item.containedItemSize.id,
        });
      }

      // add items from DTO to map
      for (const item of dto.containerMenuItems) {
        if ('id' in item) {
          const current = currentContainerItemsMap.get(item.id);
          if (!current) {
            throw new NotFoundException();
          }
          // if update dto, set values from dto if present, otherwise use current values
          currentContainerItemsMap.set(item.id, {
            containedMenuItemId:
              item.containedMenuItemId ?? current.containedMenuItemId,
            containedItemSizeId:
              item.containedItemSizeId ?? current.containedItemSizeId,
          });
        } else if ('createId' in item) {
          // add create items to map
          currentContainerItemsMap.set(item.createId, {
            containedMenuItemId: item.containedMenuItemId,
            containedItemSizeId: item.containedItemSizeId,
          });
        }
      }

      // validate no duplicates from map values (with create dto items and updated dto items)
      this.helper.enforceNoDuplicateElements(
        Array.from(currentContainerItemsMap.values()),
        (item) => `${item.containedMenuItemId}:${item.containedItemSizeId}`,
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
