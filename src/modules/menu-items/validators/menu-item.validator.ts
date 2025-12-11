import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItem, MenuItemEntity } from '../entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemContainerItemValidator } from './menu-item-container-item.validator';
import { MenuItemContainerRuleValidator } from './menu-item-container-rule.validator';

@Injectable()
export class MenuItemValidator extends ValidatorBase<MenuItemEntity> {
  constructor(
    @InjectRepository(MenuItem)
    private readonly repo: Repository<MenuItem>,

    private readonly menuItemContainerValidator: MenuItemContainerItemValidator,
    private readonly menuItemContainerRuleValidator: MenuItemContainerRuleValidator,

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

    // itemName exists
    if (await this.helper.exists(this.repo, 'itemName', dto.itemName)) {
      const err = new ValidationErrorNode(
        'itemName',
        id,
        'Menu item already exists.',
      );
      results.push(err);
    }

    if (
      dto.fixedContentDtos &&
      dto.fixedContentDtos?.length &&
      dto.variableRuleDtos &&
      dto.variableRuleDtos?.length
    ) {
      const err = new ValidationErrorNode(
        'fixedContents',
        id,
        'item cannot have both fixed and variable contents.',
      );
      results.push(err);
    }

    if (dto.fixedContentDtos && dto.fixedContentDtos?.length) {
      if (dto.type !== MENU_ITEM_TYPES.FIXED_CONTAINER) {
        const err = new ValidationErrorNode(
          'type',
          id,
          'item have fixed content but is not set to type fixed container',
        );
        results.push(err);
      }
      // nested validators
      // containerItem dtos
      const nestedDtoErr =
        await this.menuItemContainerValidator.validateManyNestedNode(
          'fixedContents',
          dto.fixedContentDtos,
        );
      if (nestedDtoErr) {
        results.push(nestedDtoErr);
      }
    }

    // variableRules
    if (dto.variableRuleDtos && dto.variableRuleDtos?.length) {
      if (dto.type !== MENU_ITEM_TYPES.VARIABLE_CONTAINER) {
        const err = new ValidationErrorNode(
          'type',
          id,
          'item have variable rules but is not set to type variable container',
        );
        results.push(err);
      }

      const nestedDtoErr =
        await this.menuItemContainerRuleValidator.validateManyNestedNode(
          'variableRules',
          dto.variableRuleDtos,
        );
      if (nestedDtoErr) {
        results.push(nestedDtoErr);
      }
    }

    if (
      dto.variableRuleDtos &&
      dto.variableRuleDtos?.length &&
      !dto.variableMaxAmount
    ) {
      const err = new ValidationErrorNode(
        'variableMaxAmount',
        id,
        'menuItem with variable amount must have a max amount',
      );
      results.push(err);
    }

    if (dto.variableMaxAmount && dto.variableMaxAmount <= 0) {
      const err = new ValidationErrorNode(
        'variableMaxAmount',
        id,
        'menuItem with variable amount must have a max amount greater than 0',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateMenuItemDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // exists
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

    if (dto.type === MENU_ITEM_TYPES.FIXED_CONTAINER) {
      if (!dto.fixedContentDtos) {
        const err = new ValidationErrorNode(
          'fixedContents',
          id,
          'Menu item of type fixed container must have fixed contents.',
        );
        results.push(err);
      }
    } else if (dto.type === MENU_ITEM_TYPES.VARIABLE_CONTAINER) {
      if (!dto.variableRuleDtos) {
        const err = new ValidationErrorNode(
          'variableRules',
          id,
          'Menu item of type variable container must have variable rules.',
        );
        results.push(err);
      }
    }

    // nested validators
    // containerItem dtos
    if (dto.fixedContentDtos && dto.fixedContentDtos?.length) {
      const nestedDtoErr =
        await this.menuItemContainerValidator.validateManyNestedNode(
          'fixedContents',
          dto.fixedContentDtos,
        );
      if (nestedDtoErr) {
        results.push(nestedDtoErr);
      }
    }

    // variableRules
    if (dto.variableRuleDtos && dto.variableRuleDtos?.length) {
      const nestedDtoErr =
        await this.menuItemContainerRuleValidator.validateManyNestedNode(
          'variableRules',
          dto.variableRuleDtos,
        );
      if (nestedDtoErr) {
        results.push(nestedDtoErr);
      }
    }

    if (dto.variableMaxAmount && dto.variableMaxAmount <= 0) {
      const err = new ValidationErrorNode(
        'variableMaxAmount',
        id,
        'menuItem with variable amount must have a max amount greater than 0',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }
}
