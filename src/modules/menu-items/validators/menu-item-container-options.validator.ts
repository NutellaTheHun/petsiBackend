import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/create-menu-item-container-options.dto';
import { UpdateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/update-menu-item-container-options.dto';
import {
  MenuItemContainerOptions,
  MenuItemContainerOptionsEntity,
} from '../entities/menu-item-container-options.entity';
import { MenuItemContainerRuleService } from '../services/menu-item-container-rule.service';
import { MenuItemContainerRuleValidator } from './menu-item-container-rule.validator';

@Injectable()
export class MenuItemContainerOptionsValidator extends ValidatorBase<MenuItemContainerOptionsEntity> {
  constructor(
    @InjectRepository(MenuItemContainerOptions)
    private readonly repo: Repository<MenuItemContainerOptions>,

    @Inject(forwardRef(() => MenuItemContainerRuleService))
    private readonly ruleService: MenuItemContainerRuleService,
    logger: AppLogger,
    requestContextService: RequestContextService,
    private readonly containerRuleValidator: MenuItemContainerRuleValidator,
  ) {
    super(repo, 'MenuItemContainerOptions', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateMenuItemContainerOptionsDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // No rules
    if (!dto.containerRuleDtos || dto.containerRuleDtos.length === 0) {
      const err = new ValidationErrorNode(
        'containerRules',
        id,
        'Menu item container has no settings.',
      );
      results.push(err);
    }

    // duplicate item rules
    const nestedCreates = dto.containerRuleDtos
      .map((nested) => nested.createDto)
      .filter((nested) => nested !== undefined);

    const dupliateItemRules = this.helper.findDuplicates(
      nestedCreates,
      (rule) => `${rule.validMenuItemId}`,
    );
    if (dupliateItemRules) {
      for (const duplicate of dupliateItemRules) {
        const err = new ValidationErrorNode(
          'containerRules',
          id, // needs NESTED id, not parent entity
          'Menu item container has duplicate item settings.',
        );
        results.push(err);
      }
    }

    const nestedErrs = await this.containerRuleValidator.validateManyNestedNode(
      'containerRules',
      dto.containerRuleDtos,
    );
    if (nestedErrs) {
      results.push(nestedErrs);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateMenuItemContainerOptionsDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // No rules
    if (dto.containerRuleDtos && dto.containerRuleDtos.length === 0) {
      const err = new ValidationErrorNode(
        'containerRules',
        id,
        'Menu item container has no settings.',
      );
      results.push(err);
    }

    // Check no duplicate item rules
    if (dto.containerRuleDtos && dto.containerRuleDtos.length > 0) {
      const resolvedDtos: { validMenuItemId: number }[] = [];
      for (const nested of dto.containerRuleDtos) {
        if (nested.createDto) {
          resolvedDtos.push({
            validMenuItemId: nested.createDto.validMenuItemId,
          });
        } else if (nested.updateDto && nested.id) {
          const currentRule = await this.ruleService.findOne(nested.id, [
            'validItem',
          ]);
          resolvedDtos.push({
            validMenuItemId:
              nested.updateDto?.validMenuItemId ?? currentRule.validItem.id,
          });
        }
      }

      const dupliateItemRules = this.helper.findDuplicates(
        resolvedDtos,
        (rule) => `${rule.validMenuItemId}`,
      );
      for (const duplicate of dupliateItemRules) {
        const err = new ValidationErrorNode(
          'containerRules',
          id, //  NEEDS NESTED ID
          'Menu item container has duplicate item settings.',
        );
        results.push(err);
      }
    }
    if (dto.containerRuleDtos) {
      const nestedErrs =
        await this.containerRuleValidator.validateManyNestedNode(
          'containerRules',
          dto.containerRuleDtos,
        );
      if (nestedErrs) {
        results.push(nestedErrs);
      }
    }

    return this.checkValidateResult(results);
  }
}
