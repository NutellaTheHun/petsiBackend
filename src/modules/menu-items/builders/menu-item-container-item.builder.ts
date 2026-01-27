import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { NestedCreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-create-menu-item-container-item.dto';
import { NestedUpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-update-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';

@Injectable()
export class MenuItemContainerItemBuilder extends BuilderBase<MenuItemContainerItem> {
  constructor(
    @InjectRepository(MenuItemContainerItem)
    private readonly containerItemRepo: Repository<MenuItemContainerItem>,

    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,

    @InjectRepository(MenuItemSize)
    private readonly itemSizeRepo: Repository<MenuItemSize>,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      MenuItemContainerItem,
      'MenuItemComponentBuilder',
      requestContextService,
      logger,
    );
  }

  protected createEntity(
    dto: CreateMenuItemContainerItemDto,
    parent?: MenuItem,
  ): void {
    // If the parentMenuItemId is provided, use it to set the parentMenuItem. (Through menu-item-container-item endpoint)
    // If the parentMenuItemId is not provided, but a parent is provided, use the parent to set the parentMenuItem. (Through create menu-item endpoint)
    if (parent) {
      this.setPropByVal('parentMenuItem', parent);
    } else if (dto.parentMenuItemId !== undefined) {
      this.parentContainerById(dto.parentMenuItemId);
    }

    if (dto.parentItemSizeId !== undefined) {
      this.parentContainerSizeById(dto.parentItemSizeId);
    }
    if (dto.containedMenuItemId !== undefined) {
      this.containedItemById(dto.containedMenuItemId);
    }
    if (dto.containedItemSizeId !== undefined) {
      this.containedItemSizeById(dto.containedItemSizeId);
    }
    if (dto.quantity !== undefined) {
      this.quantity(dto.quantity);
    }
  }

  protected updateEntity(dto: UpdateMenuItemContainerItemDto): void {
    if (dto.containedMenuItemId !== undefined) {
      this.containedItemById(dto.containedMenuItemId);
    }
    if (dto.containedItemSizeId !== undefined) {
      this.containedItemSizeById(dto.containedItemSizeId);
    }
    if (dto.quantity !== undefined) {
      this.quantity(dto.quantity);
    }
  }

  public async buildMany(
    parent: MenuItem,
    dtos: (
      | CreateMenuItemContainerItemDto
      | NestedCreateMenuItemContainerItemDto
      | NestedUpdateMenuItemContainerItemDto
    )[],
  ): Promise<MenuItemContainerItem[]> {
    const results: MenuItemContainerItem[] = [];
    for (const dto of dtos) {
      if (dto instanceof CreateMenuItemContainerItemDto) {
        results.push(await this.buildCreateDto(dto));
      } else {
        if ('createId' in dto) {
          results.push(await this.buildCreateDto(dto, parent, dto.createId));
        }
        if ('id' in dto) {
          const comp = await this.containerItemRepo.findOne({
            where: { id: dto.id },
          });
          if (!comp) {
            throw new Error('menu item container item not found');
          }
          results.push(await this.buildUpdateDto(comp, dto));
        }
      }
    }
    return results;
  }

  public parentContainerById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.menuItemRepo.findOne({ where: { id } }),
      'parentMenuItem',
      id,
    );
  }

  public parentContainerByName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.menuItemRepo.findOne({ where: { name } }),
      'parentMenuItem',
      name,
    );
  }

  public parentContainerSizeById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.itemSizeRepo.findOne({ where: { id } }),
      'parentItemSize',
      id,
    );
  }

  public containedItemById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.menuItemRepo.findOne({ where: { id } }),
      'containedMenuItem',
      id,
    );
  }

  public containedItemByName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.menuItemRepo.findOne({ where: { name } }),
      'containedMenuItem',
      name,
    );
  }

  public containedItemSizeById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.itemSizeRepo.findOne({ where: { id } }),
      'containedItemSize',
      id,
    );
  }

  public quantity(amount: number): this {
    return this.setPropByVal('quantity', amount);
  }
}
