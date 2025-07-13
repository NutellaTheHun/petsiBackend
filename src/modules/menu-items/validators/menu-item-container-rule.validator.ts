import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationError } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/create-menu-item-container-rule.dto';
import { UpdateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/update-menu-item-container-rule.dto';
import { MenuItemContainerRule } from '../entities/menu-item-container-rule.entity';
import { MenuItemService } from '../services/menu-item.service';

@Injectable()
export class MenuItemContainerRuleValidator extends ValidatorBase<MenuItemContainerRule> {
  constructor(
    @InjectRepository(MenuItemContainerRule)
    private readonly repo: Repository<MenuItemContainerRule>,

    @Inject(forwardRef(() => MenuItemService))
    private readonly itemService: MenuItemService,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'MenuItemContainerRule', requestContextService, logger);
  }

  public async validateCreate(
    dto: CreateMenuItemContainerRuleDto,
  ): Promise<void> {
    // No sizes
    if (dto.validSizeIds.length === 0) {
      this.addError({
        errorMessage: 'Menu item container setting has no sizes selected.',
        errorType: 'INVALID',
        contextEntity: 'CreateMenuItemContainerRuleDto',
        sourceEntity: 'MenuItemSize',
      } as ValidationError);
    }

    // valid sizes
    const item = await this.itemService.findOne(dto.validMenuItemId, [
      'validSizes',
    ]);
    if (!item) {
      throw new Error('item not found');
    }

    for (const scarySizeId of dto.validSizeIds) {
      if (!this.helper.isValidSize(scarySizeId, item.validSizes)) {
        this.addError({
          errorMessage: 'Invalid size for item',
          errorType: 'INVALID',
          contextEntity: 'CreateMenuItemContainerRuleDto',
          sourceEntity: 'MenuItemSize',
          sourceId: scarySizeId,
          conflictEntity: 'MenuItem',
          conflictId: item.id,
        } as ValidationError);
      }
    }

    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    dto: UpdateMenuItemContainerRuleDto,
  ): Promise<void> {
    // No sizes
    if (dto.validSizeIds?.length === 0) {
      this.addError({
        errorMessage: 'Menu item container setting has no sizes selected.',
        errorType: 'INVALID',
        contextEntity: 'UpdateMenuItemContainerRuleDto',
        sourceEntity: 'MenuItemSize',
      } as ValidationError);
    }

    // validate sizes
    if (dto.validMenuItemId || dto.validSizeIds) {
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

      const item = await this.itemService.findOne(itemId, ['validSizes']);
      if (!item) {
        throw new Error('item not found');
      }

      for (const scarySize of sizeIds) {
        if (!this.helper.isValidSize(scarySize, item.validSizes)) {
          this.addError({
            errorMessage: 'Invalid size for item',
            errorType: 'INVALID',
            contextEntity: 'CreateMenuItemContainerRuleDto',
            contextId: id,
            sourceEntity: 'MenuItemSize',
            sourceId: scarySize,
            conflictEntity: 'MenuItem',
            conflictId: item.id,
          } as ValidationError);
        }
      }
    }

    this.throwIfErrors();
  }
}
