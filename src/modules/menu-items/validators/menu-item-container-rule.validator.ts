import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/create-menu-item-container-rule.dto';
import { UpdateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/update-menu-item-container-rule.dto';
import {
  MenuItemContainerRule,
  MenuItemContainerRuleEntity,
} from '../entities/menu-item-container-rule.entity';
import { MenuItem } from '../menu-items.module';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';

@Injectable()
export class MenuItemContainerRuleValidator extends ValidatorBase<MenuItemContainerRuleEntity> {
  constructor(
    @InjectRepository(MenuItemContainerRule)
    private readonly repo: Repository<MenuItemContainerRule>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'MenuItemContainerRule', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateMenuItemContainerRuleDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Validate Parent
    const parentItem = await this.menuItemRepo.findOne({
      where: { id: dto.parentMenuItemId },
      relations: ['validSizes'],
    });
    if (!parentItem) {
      throw new Error(
        `MenuItemContainerRule Validator: parent item not found with id ${dto.parentMenuItemId}`,
      );
    }

    // validate parent menu item type
    if (
      parentItem.type !== MENU_ITEM_TYPES.FIXED_CONTAINER &&
      parentItem.type !== MENU_ITEM_TYPES.VARIABLE_CONTAINER
    ) {
      const err = new ValidationErrorNode(
        'parentMenuItem',
        id,
        'Parent menu item container is of the wrong type',
      );
      results.push(err);
    }

    //Validate validItem
    const validItem = await this.menuItemRepo.findOne({
      where: { id: dto.validMenuItemId },
      relations: ['validSizes'],
    });
    if (!validItem) {
      throw new Error('item not found');
    }

    if (validItem.type !== MENU_ITEM_TYPES.SINGLE) {
      const err = new ValidationErrorNode(
        'validItem',
        id,
        'valid item is of the wrong type, must be single',
      );
      results.push(err);
    }

    if (dto.validSizeIds.length === 0) {
      // No sizes
      const err = new ValidationErrorNode(
        'validItem',
        id,
        'Menu item container setting has no sizes selected.',
      );
      results.push(err);
    }

    // valid sizes
    for (const dirtySizeId of dto.validSizeIds) {
      if (!this.helper.isValidSize(dirtySizeId, validItem.validSizes)) {
        const err = new ValidationErrorNode(
          'validSizes',
          dirtySizeId,
          'Invalid size for item.',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateMenuItemContainerRuleDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // No sizes
    if (dto.validSizeIds && dto.validSizeIds?.length === 0) {
      const err = new ValidationErrorNode(
        'validItem',
        id,
        'Menu item container setting has no sizes selected for updating.',
      );
      results.push(err);
    }

    // validate item and sizes
    if (dto.validMenuItemId || (dto.validSizeIds && dto.validSizeIds.length)) {
      const currentRule = await this.repo.findOne({
        where: { id },
        relations: ['validItem', 'validSizes'],
      });
      if (!currentRule) {
        throw new Error();
      }

      const sizeIds =
        dto.validSizeIds ?? currentRule?.validSizes.map((size) => size.id);
      const itemId = dto.validMenuItemId ?? currentRule?.validItem.id;

      const item = await this.menuItemRepo.findOne({
        where: { id: itemId },
        relations: ['validSizes'],
      });
      if (!item) {
        throw new Error('item not found');
      }

      if (item.type !== MENU_ITEM_TYPES.SINGLE) {
        const err = new ValidationErrorNode(
          'validItem',
          id,
          'valid item is of the wrong type, must be single',
        );
        results.push(err);
      }

      for (const scarySize of sizeIds) {
        if (!this.helper.isValidSize(scarySize, item.validSizes)) {
          const err = new ValidationErrorNode(
            'validSizes',
            id, // cant get both the id of the rule and the id of the valid size that is erroneous?
            'Invalid size for item.',
          );
          results.push(err);
        }
      }
    }

    return this.checkValidateResult(results);
  }
}
