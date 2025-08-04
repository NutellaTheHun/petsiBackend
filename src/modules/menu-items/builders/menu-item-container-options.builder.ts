import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../base/builder-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/create-menu-item-container-options.dto';
import { NestedMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/nested-menu-item-container-options.dto';
import { UpdateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/update-menu-item-container-options.dto';
import { CreateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/create-menu-item-container-rule.dto';
import { NestedMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/nested-menu-item-container-rule.dto';
import { MenuItemContainerOptions } from '../entities/menu-item-container-options.entity';
import { MenuItem } from '../menu-items.module';
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

  protected createEntity(
    dto: CreateMenuItemContainerOptionsDto,
    parent?: MenuItem,
  ): void {
    // If the parentMenuItemId is provided, use it to set the parentMenuItem. (Through menu-item-container-options endpoint)
    // If the parentMenuItemId is not provided, but a parent is provided, use the parent to set the parentMenuItem. (Through create menu-item endpoint)

    if (parent) {
      this.setPropByVal('parentContainer', parent);
    } else if (dto.parentContainerMenuItemId !== undefined) {
      this.parentContainerById(dto.parentContainerMenuItemId);
    }

    if (dto.containerRuleDtos !== undefined) {
      this.containerRulesByBuilder(dto.containerRuleDtos);
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
    parent: MenuItem,
    dto: CreateMenuItemContainerOptionsDto | NestedMenuItemContainerOptionsDto,
  ): Promise<MenuItemContainerOptions> {
    if (dto instanceof CreateMenuItemContainerOptionsDto) {
      return await this.buildCreateDto(dto);
    } else {
      if (dto.createDto) {
        return await this.buildCreateDto(dto.createDto, parent);
      }
      if (dto.updateDto && dto.id) {
        const toUpdate = await this.itemComponentOptionsService.findOne(dto.id);
        if (!toUpdate) {
          throw new Error('options is null');
        }
        return await this.buildUpdateDto(toUpdate, dto);
      }
    }
    throw new Error('invalid dto');
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
