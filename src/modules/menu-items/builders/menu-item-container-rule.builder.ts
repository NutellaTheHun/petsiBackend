import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../base/builder-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/create-menu-item-container-rule.dto';
import { NestedMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/nested-menu-item-container-rule.dto';
import { UpdateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/update-menu-item-container-rule.dto';
import { MenuItemContainerOptions } from '../entities/menu-item-container-options.entity';
import { MenuItemContainerRule } from '../entities/menu-item-container-rule.entity';
import { MenuItemContainerOptionsService } from '../services/menu-item-container-options.service';
import { MenuItemContainerRuleService } from '../services/menu-item-container-rule.service';
import { MenuItemSizeService } from '../services/menu-item-size.service';
import { MenuItemService } from '../services/menu-item.service';
import { MenuItemContainerRuleValidator } from '../validators/menu-item-container-rule.validator';
@Injectable()
export class MenuItemContainerRuleBuilder extends BuilderBase<MenuItemContainerRule> {
  constructor(
    @Inject(forwardRef(() => MenuItemContainerRuleService))
    private readonly componentOptionService: MenuItemContainerRuleService,

    @Inject(forwardRef(() => MenuItemContainerOptionsService))
    private readonly itemOptionsSerivce: MenuItemContainerOptionsService,

    @Inject(forwardRef(() => MenuItemService))
    private readonly menuItemService: MenuItemService,

    private readonly sizeService: MenuItemSizeService,

    validator: MenuItemContainerRuleValidator,
    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      MenuItemContainerRule,
      'MenuItemCategoryBuilder',
      requestContextService,
      logger,
      validator,
    );
  }

  protected createEntity(
    dto: CreateMenuItemContainerRuleDto,
    parent?: MenuItemContainerOptions,
  ): void {
    // If the parentContainerOptionsId is provided, use it to set the parentContainerOption. (Through menu-item-container-rule endpoint)
    // If the parentContainerOptionsId is not provided, but a parent is provided, use the parent to set the parentContainerOption. (Through create menu-item-container-options endpoint)
    if (parent) {
      this.setPropByVal('parentContainerOption', parent);
    } else if (dto.parentContainerOptionsId !== undefined) {
      this.parentContainerOptionsById(dto.parentContainerOptionsId);
    }

    if (dto.validMenuItemId !== undefined) {
      this.validMenuItemById(dto.validMenuItemId);
    }
    if (dto.validSizeIds !== undefined) {
      this.validMenuItemSizeByIds(dto.validSizeIds);
    }
  }

  protected updateEntity(dto: UpdateMenuItemContainerRuleDto): void {
    if (dto.validMenuItemId !== undefined) {
      this.validMenuItemById(dto.validMenuItemId);
    }
    if (dto.validSizeIds !== undefined) {
      this.validMenuItemSizeByIds(dto.validSizeIds);
    }
  }

  public async buildMany(
    parent: MenuItemContainerOptions,
    dtos: (CreateMenuItemContainerRuleDto | NestedMenuItemContainerRuleDto)[],
  ): Promise<MenuItemContainerRule[]> {
    const results: MenuItemContainerRule[] = [];
    for (const dto of dtos) {
      if (dto instanceof CreateMenuItemContainerRuleDto) {
        results.push(await this.buildCreateDto(dto));
      } else {
        if (dto.create) {
          results.push(await this.buildCreateDto(dto.create, parent));
        }
        if (dto.update) {
          const toUpdate = await this.componentOptionService.findOne(
            dto.update.id,
          );
          if (!toUpdate) {
            throw Error('component option is null');
          }
          results.push(await this.buildUpdateDto(toUpdate, dto));
        }
      }
    }

    return results;
  }

  private parentContainerOptionsById(id: number): this {
    return this.setPropById(
      this.itemOptionsSerivce.findOne.bind(this.itemOptionsSerivce),
      'parentContainerOption',
      id,
    );
  }

  private validMenuItemById(id: number): this {
    return this.setPropById(
      this.menuItemService.findOne.bind(this.menuItemService),
      'validItem',
      id,
    );
  }

  private validMenuItemSizeByIds(ids: number[]): this {
    return this.setPropsByIds(
      this.sizeService.findEntitiesById.bind(this.sizeService),
      'validSizes',
      ids,
    );
  }
}
