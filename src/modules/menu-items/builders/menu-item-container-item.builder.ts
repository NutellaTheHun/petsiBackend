import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { NestedCreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-create-menu-item-container-item.dto';
import { NestedUpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-update-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItem } from '../menu-items.module';
import { MenuItemContainerItemService } from '../services/menu-item-container-item.service';
import { MenuItemSizeService } from '../services/menu-item-size.service';
import { MenuItemService } from '../services/menu-item.service';

@Injectable()
export class MenuItemContainerItemBuilder extends BuilderBase<MenuItemContainerItem> {
  constructor(
    @Inject(forwardRef(() => MenuItemContainerItemService))
    private readonly componentService: MenuItemContainerItemService,

    @Inject(forwardRef(() => MenuItemService))
    private readonly menuItemService: MenuItemService,

    private readonly itemSizeService: MenuItemSizeService,

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
          const comp = await this.componentService.findOne(dto.id);
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
      this.menuItemService.findOne.bind(this.menuItemService),
      'parentMenuItem',
      id,
    );
  }

  public parentContainerByName(name: string): this {
    return this.setPropByName(
      this.menuItemService.findOneByName.bind(this.menuItemService),
      'parentMenuItem',
      name,
    );
  }

  public parentContainerSizeById(id: number): this {
    return this.setPropById(
      this.itemSizeService.findOne.bind(this.itemSizeService),
      'parentItemSize',
      id,
    );
  }

  public containedItemById(id: number): this {
    return this.setPropById(
      this.menuItemService.findOne.bind(this.menuItemService),
      'containedMenuItem',
      id,
    );
  }

  public containedItemByName(name: string): this {
    return this.setPropByName(
      this.menuItemService.findOneByName.bind(this.menuItemService),
      'containedMenuItem',
      name,
    );
  }

  public containedItemSizeById(id: number): this {
    return this.setPropById(
      this.itemSizeService.findOne.bind(this.itemSizeService),
      'containedItemSize',
      id,
    );
  }

  public quantity(amount: number): this {
    return this.setPropByVal('quantity', amount);
  }
}
