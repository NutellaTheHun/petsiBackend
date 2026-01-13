import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import {
  MenuItemContainerItem,
  MenuItemContainerItemEntity,
} from '../entities/menu-item-container-item.entity';
import { MenuItem } from '../menu-items.module';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';

@Injectable()
export class MenuItemContainerItemValidator extends ValidatorBase<MenuItemContainerItemEntity> {
  constructor(
    @InjectRepository(MenuItemContainerItem)
    private readonly repo: Repository<MenuItemContainerItem>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'MenuItemContainerItem', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateMenuItemContainerItemDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    let parentItem: MenuItem | null = null;

    const containedItem = await this.menuItemRepo.findOne({
      where: { id: dto.containedMenuItemId },
      relations: ['sizes'],
    });
    if (!containedItem) {
      throw new Error();
    }

    // valid contained item size to menu item
    await this.helper.enforceInList(
      dto.containedItemSizeId,
      containedItem.sizes.map((x) => x.id),
      'containedItemSize',
      results,
      'Invalid size',
      id,
    );

    // Contained items must be of type single (no containers in containers)
    if (containedItem.type !== MENU_ITEM_TYPES.SINGLE) {
      const err = new ValidationErrorNode(
        'containedMenuItem',
        id,
        'contained item must be of type single',
      );
      results.push(err);
    }

    if (dto.parentMenuItemId) {
      parentItem = await this.menuItemRepo.findOne({
        where: { id: dto.parentMenuItemId },
        relations: ['sizes'],
      });
      if (!parentItem) {
        throw new Error();
      }
      if (parentItem.type !== MENU_ITEM_TYPES.CONTAINER) {
        const err = new ValidationErrorNode(
          'parentMenuItem',
          id,
          'parent item must be of type container',
        );
        results.push(err);
      }
    }

    // validate parent item / size
    if (dto.parentItemSizeId) {
      if (!parentItem) {
        parentItem = await this.menuItemRepo.findOne({
          where: { id: dto.parentMenuItemId },
          relations: ['sizes'],
        });
        if (!parentItem) {
          throw new Error();
        }
      }
      await this.helper.enforceInList(
        dto.parentItemSizeId,
        parentItem.sizes.map((x) => x.id),
        'parentItemSize',
        results,
        'Invalid size',
        id,
      );
    }

    // validate quanitity
    await this.helper.enforcePositive(
      dto.quantity,
      'quantity',
      results,
      'Invalid quantity',
      id,
    );

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateMenuItemContainerItemDto,
    id: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    let currentEntity: MenuItemContainerItem | null = null;

    // If updating contained item or size, get the current entity
    if (dto.containedMenuItemId || dto.containedItemSizeId) {
      currentEntity = await this.repo.findOne({
        where: { id },
        relations: [
          'containedMenuItem',
          'containedItemSize',
          'containedItem.sizes',
        ],
      });
      if (!currentEntity) {
        throw new Error(
          `MenuItemContainerItem validation: entity to update with id ${id} not found`,
        );
      }
    }

    // Validate contained item type
    if (dto.containedMenuItemId) {
      if (currentEntity?.containedMenuItem.type !== MENU_ITEM_TYPES.SINGLE) {
        const err = new ValidationErrorNode(
          'containedMenuItem',
          id,
          'contained item must be of type single',
        );
        results.push(err);
      }
    }

    // Validate contained item size is valid to the contained menu item
    if (dto.containedItemSizeId) {
      let sizes = currentEntity?.containedMenuItem.sizes.map((x) => x.id) ?? [];

      // Handle if updating both contained item and size
      if (dto.containedMenuItemId) {
        const newContainedItem = await this.menuItemRepo.findOne({
          where: { id: dto.containedMenuItemId },
          relations: ['sizes'],
        });
        if (!newContainedItem) {
          throw new Error();
        }
        sizes = newContainedItem.sizes.map((x) => x.id);
      }

      await this.helper.enforceInList(
        dto.containedItemSizeId,
        sizes,
        'containedItemSize',
        results,
        'Invalid size',
        id,
      );
    }

    // Validate quantity is greater than 0
    if (dto.quantity) {
      await this.helper.enforcePositive(
        dto.quantity,
        'quantity',
        results,
        'Invalid quantity',
        id,
      );
    }

    return this.checkValidateResult(results);
  }
}
