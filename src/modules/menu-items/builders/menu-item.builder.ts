import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { NestedCreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-create-menu-item-container-item.dto';
import { NestedUpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-update-menu-item-container-item.dto';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { MenuItemContainerItemBuilder } from './menu-item-container-item.builder';

@Injectable()
export class MenuItemBuilder extends BuilderBase<MenuItem> {
  constructor(
    @InjectRepository(MenuItemCategory)
    private readonly categoryRepo: Repository<MenuItemCategory>,

    @InjectRepository(MenuItemContainerItem)
    private readonly containerItemRepo: Repository<MenuItemContainerItem>,

    @InjectRepository(MenuItemSize)
    private readonly sizeRepo: Repository<MenuItemSize>,

    @Inject(forwardRef(() => MenuItemContainerItemBuilder))
    private readonly containerItemBuilder: MenuItemContainerItemBuilder,

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
      async (ids: number[]) =>
        await this.sizeRepo.find({ where: { id: In(ids) } }),
      'sizes',
      ids,
    );
  }

  public categorybyId(id: number | null): this {
    if (id === null) {
      return this.setPropByVal('category', null);
    }
    return this.setPropById(
      async (id: number) => await this.categoryRepo.findOne({ where: { id } }),
      'category',
      id,
    );
  }

  public categorybyName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.categoryRepo.findOne({ where: { name } }),
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
