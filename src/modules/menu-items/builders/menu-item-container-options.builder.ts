import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../base/builder-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/create-menu-item-container-options.dto';
import { NestedUpdateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/nested-update-menu-item-container-options.dto copy';
import { UpdateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/update-menu-item-container-options.dto';
import { CreateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/create-menu-item-container-rule.dto';
import { NestedMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/nested-menu-item-container-rule.dto';
import { MenuItemContainerOptions } from '../entities/menu-item-container-options.entity';
import { MenuItemContainerOptionsService } from '../services/menu-item-container-options.service';
import { MenuItemService } from '../services/menu-item.service';
import { MenuItemContainerOptionsValidator } from '../validators/menu-item-container-options.validator';
import { MenuItemContainerRuleBuilder } from './menu-item-container-rule.builder';

@Injectable()
export class MenuItemContainerOptionsBuilder extends BuilderBase<MenuItemContainerOptions> {
  constructor(
    @Inject(forwardRef(() => MenuItemContainerOptionsService))
    private readonly itemComponentOptionsService: MenuItemContainerOptionsService,

    @Inject(forwardRef(() => MenuItemService))
    private readonly menuItemService: MenuItemService,

    @Inject(forwardRef(() => MenuItemContainerRuleBuilder))
    private readonly containerRuleBuilder: MenuItemContainerRuleBuilder,

    validator: MenuItemContainerOptionsValidator,
    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      MenuItemContainerOptions,
      'MenuItemComponentOptionsBuilder',
      requestContextService,
      logger,
      validator,
    );
  }

  protected createEntity(dto: CreateMenuItemContainerOptionsDto): void {
    if (dto.containerRuleDtos !== undefined) {
      this.containerRulesByBuilder(dto.containerRuleDtos);
    }
    if (dto.parentContainerMenuItemId !== undefined) {
      this.parentContainerById(dto.parentContainerMenuItemId);
    }
    if (dto.validQuantity !== undefined) {
      this.validQuantity(dto.validQuantity);
    }
  }

  protected updateEntity(dto: UpdateMenuItemContainerOptionsDto): void {
    if (dto.containerRuleDtos !== undefined) {
      this.containerRulesByBuilder(dto.containerRuleDtos);
    }
    if (dto.validQuantity !== undefined) {
      this.validQuantity(dto.validQuantity);
    }
  }

  public async buildDto(
    dto:
      | CreateMenuItemContainerOptionsDto
      | NestedUpdateMenuItemContainerOptionsDto,
  ): Promise<MenuItemContainerOptions> {
    if (dto instanceof CreateMenuItemContainerOptionsDto) {
      return await this.buildCreateDto(dto);
    } else {
      const toUpdate = await this.itemComponentOptionsService.findOne(dto.id);
      if (!toUpdate) {
        throw new Error('options is null');
      }

      return await this.buildUpdateDto(toUpdate, dto);
    }
  }

  public containerRulesByBuilder(
    dtos: (CreateMenuItemContainerRuleDto | NestedMenuItemContainerRuleDto)[],
  ): this {
    return this.setPropByBuilder(
      this.containerRuleBuilder.buildMany.bind(this.containerRuleBuilder),
      'containerRules',
      this.entity,
      dtos,
    );
  }

  public validQuantity(amount: number): this {
    return this.setPropByVal('validQuantity', amount);
  }

  public parentContainerById(id: number): this {
    return this.setPropById(
      this.menuItemService.findOne.bind(this.menuItemService),
      'parentContainer',
      id,
    );
  }
}
