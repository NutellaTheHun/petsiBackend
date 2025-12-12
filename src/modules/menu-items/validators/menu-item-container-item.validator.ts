import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
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

    const containedItem = await this.menuItemRepo.findOne({
      where: { id: dto.containedMenuItemId },
      relations: ['validSizes'],
    });
    if (!containedItem) {
      throw new Error();
    }
    // contained item size must be valid to the contained item
    if (
      !this.helper.isValidSize(
        dto.containedItemSizeId,
        containedItem.validSizes,
      )
    ) {
      const err = new ValidationErrorNode(
        'containedItemSize',
        id,
        'Invalid size',
      );
      results.push(err);
    }

    // Contained items must be of type single (no containers in containers)
    if (containedItem.type !== MENU_ITEM_TYPES.SINGLE) {
      const err = new ValidationErrorNode(
        'containedItem',
        id,
        'contained item must be of type single',
      );
      results.push(err);
    }

    if (dto.parentMenuItemId) {
      const parentItem = await this.menuItemRepo.findOne({
        where: { id: dto.parentMenuItemId },
        relations: ['validSizes'],
      });
      if (!parentItem) {
        throw new Error();
      }
      if (parentItem.type !== MENU_ITEM_TYPES.CONTAINER) {
        const err = new ValidationErrorNode(
          'parent',
          id,
          'parent item must be of type container',
        );
        results.push(err);
      }

      // validate parent item / size
      if (dto.parentItemSizeId) {
        if (
          !this.helper.isValidSize(dto.parentItemSizeId, parentItem.validSizes)
        ) {
          const err = new ValidationErrorNode(
            'parentItemSize',
            id,
            'Invalid size',
          );
          results.push(err);
        }
      }
    }

    // validate quanitity
    if (dto.quantity <= 0) {
      const err = new ValidationErrorNode('quantity', id, 'Invalid quanity');
      results.push(err);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateMenuItemContainerItemDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // validate size
    if ((dto.containedItemId || dto.containedItemSizeId) && id) {
      const currentEntity = await this.repo.findOne({
        where: { id },
        relations: ['containedItem', 'containedItemSize'],
      });
      if (!currentEntity) {
        throw new Error(
          `MenuItemContainerItem validation: entity to update with id ${id} not found`,
        );
      }

      const itemId = dto.containedItemId ?? currentEntity.containedItem.id;
      const sizeId =
        dto.containedItemSizeId ?? currentEntity.containedItemSize.id;

      const containedItem = await this.menuItemRepo.findOne({
        where: { id: itemId },
        relations: ['validSizes'],
      });
      if (!containedItem) {
        throw new Error();
      }

      if (containedItem.type !== MENU_ITEM_TYPES.SINGLE) {
        const err = new ValidationErrorNode(
          'containedItem',
          id,
          'contained item must be of type single',
        );
        results.push(err);
      }

      if (!this.helper.isValidSize(sizeId, containedItem.validSizes)) {
        const err = new ValidationErrorNode(
          'containedItemSize',
          id,
          'Invalid size',
        );
        results.push(err);
      }
    }

    // validate quanitity
    if (dto.quantity && dto.quantity <= 0) {
      const err = new ValidationErrorNode('quantity', id, 'Invalid quanity');
      results.push(err);
    }

    return this.checkValidateResult(results);
  }
}
