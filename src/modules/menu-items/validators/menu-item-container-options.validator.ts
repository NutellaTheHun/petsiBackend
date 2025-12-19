import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/create-menu-item-container-options.dto';
import { UpdateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/update-menu-item-container-options.dto';
import {
  MenuItemContainerOptions,
  MenuItemContainerOptionsEntity,
} from '../entities/menu-item-container-options.entity';
import { MenuItemContainerRuleValidator } from './menu-item-container-rule.validator';

@Injectable()
export class MenuItemContainerOptionsValidator extends ValidatorBase<MenuItemContainerOptionsEntity> {
  constructor(
    @InjectRepository(MenuItemContainerOptions)
    private readonly repo: Repository<MenuItemContainerOptions>,

    private readonly containerRuleValidator: MenuItemContainerRuleValidator,

    logger: AppLogger,
    requestContextService: RequestContextService,
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

    const nestedDtoErrs =
      await this.containerRuleValidator.validateManyNestedNode(
        'containerRules',
        dto.containerRuleDtos,
      );
    if (nestedDtoErrs) {
      results.push(nestedDtoErrs);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateMenuItemContainerOptionsDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.containerRuleDtos && dto.containerRuleDtos.length) {
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
