import { Injectable, NotFoundException } from '@nestjs/common';
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
    private readonly containerItemRepo: Repository<MenuItemContainerItem>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(
      containerItemRepo,
      'MenuItemContainerItem',
      requestContextService,
      logger,
    );
  }

  protected async doValidateCreateNode(
    dto: CreateMenuItemContainerItemDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    const containedItem = await this.menuItemRepo.findOne({
      where: { id: dto.containedMenuItemId },
      relations: ['sizes'],
    });
    if (!containedItem) {
      throw new Error();
    }

    // Contained items must be of type single (no containers in containers)
    if (containedItem.type !== MENU_ITEM_TYPES.SINGLE) {
      const err = new ValidationErrorNode(
        'containedMenuItem',
        id,
        'contained item must be of type single',
      );
      results.push(err);
    }

    // valid container item / size
    await this.helper.enforceValidSize(
      dto.containedItemSizeId,
      containedItem.id,
      this.menuItemRepo,
      'sizes',
      'containedItemSize',
      results,
      'Invalid size',
      id,
    );

    const parentItem = await this.menuItemRepo.findOne({
      where: { id: dto.parentMenuItemId },
      relations: ['sizes'],
    });
    if (!parentItem) {
      throw new Error();
    }

    // parent item must be a container
    if (parentItem.type !== MENU_ITEM_TYPES.CONTAINER) {
      const err = new ValidationErrorNode(
        'parentMenuItem',
        id,
        'parent item must be of type container',
      );
      results.push(err);
    }

    // validate parent item / size
    await this.helper.enforceValidSize(
      dto.parentItemSizeId,
      parentItem.id,
      this.menuItemRepo,
      'sizes',
      'parentItemSize',
      results,
      'Invalid size',
      id,
    );

    // validate parent item is not equal to contained item
    if (parentItem.id === containedItem.id) {
      const err = new ValidationErrorNode(
        'parentMenuItem',
        id,
        'parent menu item cannot be equal to contained menu item',
      );
      results.push(err);
    }

    // validate quanitity
    await this.helper.enforcePositive(
      dto.quantity,
      'quantity',
      results,
      'Invalid quantity',
      id,
    );

    // if container is set to variable max amount, quantity must equal the variable max amount
    if (parentItem.variableMaxAmount) {
      if (dto.quantity !== parentItem.variableMaxAmount) {
        const err = new ValidationErrorNode(
          'quantity',
          id,
          'quantity must equal the variable max amount of the container',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateMenuItemContainerItemDto,
    id: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    const containerEntity = await this.containerItemRepo.findOne({
      where: { id },
      relations: [
        'containedMenuItem',
        'containedItemSize',
        'containedMenuItem.parentMenuItem',
        'containedMenuItem.parentItemSize',
      ],
    });
    if (!containerEntity) {
      throw new Error(
        `MenuItemContainerItem validation: entity to update with id ${id} not found`,
      );
    }

    // Validate new contained item / item size combination
    if (dto.containedMenuItemId || dto.containedItemSizeId) {
      const containedItemId =
        dto.containedMenuItemId ?? containerEntity.containedMenuItem.id;

      const containedItemSizeId =
        dto.containedItemSizeId ?? containerEntity.containedItemSize.id;

      await this.helper.enforceValidSize(
        containedItemSizeId,
        containedItemId,
        this.menuItemRepo,
        'sizes',
        'containedItemSize',
        results,
        'Invalid size',
        id,
      );
    }

    if (dto.containedMenuItemId) {
      const containedItem = await this.menuItemRepo.findOne({
        where: { id: dto.containedMenuItemId },
      });
      if (!containedItem) {
        throw new NotFoundException();
      }

      // Validate contained item type is single
      if (containedItem.type !== MENU_ITEM_TYPES.SINGLE) {
        const err = new ValidationErrorNode(
          'containedMenuItem',
          id,
          'contained item must be of type single',
        );
        results.push(err);
      }

      // validate contained item doesnt equal parent item
      if (containedItem.id === containerEntity.parentMenuItem.id) {
        const err = new ValidationErrorNode(
          'containedMenuItem',
          id,
          'contained item cannot be equal to parent item',
        );
        results.push(err);
      }
    }

    if (dto.quantity) {
      // must be greater than 0
      await this.helper.enforcePositive(
        dto.quantity,
        'quantity',
        results,
        'Invalid quantity',
        id,
      );

      // if container is set to variable max amount, quantity must equal the variable max amount
      if (containerEntity.parentMenuItem.variableMaxAmount) {
        if (dto.quantity !== containerEntity.parentMenuItem.variableMaxAmount) {
          const err = new ValidationErrorNode(
            'quantity',
            id,
            'quantity must equal the variable max amount of the container',
          );
          results.push(err);
        }
      }
    }

    return this.checkValidateResult(results);
  }
}
