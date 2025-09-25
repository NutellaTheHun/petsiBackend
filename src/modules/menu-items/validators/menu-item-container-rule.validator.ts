import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
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
    createId: string,
    dto: CreateMenuItemContainerRuleDto,
  ): Promise<void> {
    // No sizes
    if (dto.validSizeIds.length === 0) {
      this.addError(
        this.buildValidationError(
          'validItem',
          'Menu item container setting has no sizes selected.',
          'INVALID',
          undefined,
          createId,
        ),
      );
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
        this.addError(
          this.buildValidationError(
            'validSizes',
            'Invalid size for item.',
            'INVALID',
            undefined,
            createId,
          ),
        );
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
      this.addError(
        this.buildValidationError(
          'validSizes',
          'Menu item container setting has no sizes selected.',
          'INVALID',
          id,
        ),
      );
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
          this.addError(
            this.buildValidationError(
              'validSizes',
              'Invalid size for item',
              'INVALID',
              id,
            ),
          );
        }
      }
    }

    this.throwIfErrors();
  }
}
