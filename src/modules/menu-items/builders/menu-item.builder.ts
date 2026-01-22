import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { NestedCreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-create-menu-item-container-item.dto';
import { NestedUpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-update-menu-item-container-item.dto';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { MenuItemCategoryService } from '../services/menu-item-category.service';
import { MenuItemSizeService } from '../services/menu-item-size.service';
import { MenuItemContainerItemBuilder } from './menu-item-container-item.builder';

@Injectable()
export class MenuItemBuilder extends BuilderBase<MenuItem> {
  constructor(
    @Inject(forwardRef(() => MenuItemCategoryService))
    private readonly categoryService: MenuItemCategoryService,

    @Inject(forwardRef(() => MenuItemContainerItemBuilder))
    private readonly containerItemBuilder: MenuItemContainerItemBuilder,

    private readonly sizeService: MenuItemSizeService,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(MenuItem, 'MenuItemBuilder', requestContextService, logger);
  }

  protected createEntity(dto: CreateMenuItemDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }

    if (dto.type !== undefined) {
      this.type(dto.type);
    }

    if (dto.variableMaxAmount !== undefined) {
      this.variableMaxAmount(dto.variableMaxAmount);
    }

    // Entities
    if (dto.sizeIds !== undefined) {
      this.validSizesById(dto.sizeIds);
    }
    if (dto.categoryId !== undefined) {
      this.categorybyId(dto.categoryId);
    }
    if (dto.containerMenuItems !== undefined) {
      this.containerMenuItemsByBuilder(dto.containerMenuItems);
    }
  }

  protected updateEntity(dto: UpdateMenuItemDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }

    if (dto.type !== undefined) {
      this.type(dto.type);
    }

    if (dto.variableMaxAmount !== undefined) {
      this.variableMaxAmount(dto.variableMaxAmount);
    }

    // Entities
    if (dto.sizeIds !== undefined) {
      this.validSizesById(dto.sizeIds);
    }
    if (dto.categoryId !== undefined) {
      this.categorybyId(dto.categoryId);
    }
    if (dto.containerMenuItems !== undefined) {
      this.containerMenuItemsByBuilder(dto.containerMenuItems);
    }
  }

  public name(name: string): this {
    return this.setPropByVal('name', name);
  }

  public type(type: string): this {
    return this.setPropByVal('type', type);
  }

  public variableMaxAmount(val: number | null): this {
    return this.setPropByVal('variableMaxAmount', val);
  }

  public containerMenuItems(val: MenuItemContainerItem[]): this {
    return this.setPropByVal('containerMenuItems', val);
  }

  public validSizesById(ids: number[]): this {
    return this.setPropsByIds(
      this.sizeService.findEntitiesById.bind(this.sizeService),
      'sizes',
      ids,
    );
  }

  public categorybyId(id: number | null): this {
    if (id === null) {
      return this.setPropByVal('category', null);
    }
    return this.setPropById(
      this.categoryService.findOne.bind(this.categoryService),
      'category',
      id,
    );
  }

  public categorybyName(name: string): this {
    return this.setPropByName(
      this.categoryService.findOneByName.bind(this.categoryService),
      'category',
      name,
    );
  }

  public containerMenuItemsByBuilder(
    dtos: (
      | CreateMenuItemContainerItemDto
      | NestedCreateMenuItemContainerItemDto
      | NestedUpdateMenuItemContainerItemDto
    )[],
  ): this {
    return this.setPropByBuilder(
      this.containerItemBuilder.buildMany.bind(this.containerItemBuilder),
      'containerMenuItems',
      this.entity,
      dtos,
    );
  }
}
