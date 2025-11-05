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

    // No sizes
    if (dto.validSizeIds.length === 0) {
      const err = new ValidationErrorNode(
        'validItem',
        id,
        'Menu item container setting has no sizes selected.',
      );
      results.push(err);
    }

    // valid sizes
    /*const item = await this.itemService.findOne(dto.validMenuItemId, [
      'validSizes',
    ]);*/
    const item = await this.menuItemRepo.findOne({
      where: { id: dto.validMenuItemId },
      relations: ['validSizes'],
    });
    if (!item) {
      throw new Error('item not found');
    }

    for (const dirtySizeId of dto.validSizeIds) {
      if (!this.helper.isValidSize(dirtySizeId, item.validSizes)) {
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
    if (dto.validSizeIds && dto.validSizeIds.length === 0) {
      const err = new ValidationErrorNode(
        'validItem',
        id,
        'Menu item container setting has no sizes selected.',
      );
      results.push(err);
    }

    // validate sizes
    if (
      dto.validMenuItemId ||
      (dto.validSizeIds && dto.validSizeIds.length > 0)
    ) {
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

      //const item = await this.itemService.findOne(itemId, ['validSizes']);
      const item = await this.menuItemRepo.findOne({
        where: { id: itemId },
        relations: ['validSizes'],
      });
      if (!item) {
        throw new Error('item not found');
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
