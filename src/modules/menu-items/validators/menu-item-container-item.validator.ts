import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationError } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemContainerItemService } from '../services/menu-item-container-item.service';
import { MenuItemService } from '../services/menu-item.service';

@Injectable()
export class MenuItemContainerItemValidator extends ValidatorBase<MenuItemContainerItem> {
  constructor(
    @InjectRepository(MenuItemContainerItem)
    repo: Repository<MenuItemContainerItem>,

    @Inject(forwardRef(() => MenuItemContainerItemService))
    private readonly containerService: MenuItemContainerItemService,

    @Inject(forwardRef(() => MenuItemService))
    private readonly itemService: MenuItemService,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'MenuItemContainerItem', requestContextService, logger);
  }

  public async validateCreate(
    dto: CreateMenuItemContainerItemDto,
  ): Promise<void> {
    // validate container item size
    const item = await this.itemService.findOne(dto.containedMenuItemId, [
      'validSizes',
    ]);
    if (!item) {
      throw new Error();
    }
    if (
      !this.helper.isValidSize(dto.containedMenuItemSizeId, item.validSizes)
    ) {
      this.addError({
        errorMessage: 'Invalid menu item size',
        errorType: 'INVALID',
        contextEntity: 'CreateChildMenuItemContainerItemDto',
        sourceEntity: 'MenuItemSize',
        conflictEntity: 'MenuItem',
        value: {
          containedMenuItemId: dto.containedMenuItemId,
          containedMenuItemSizeId: dto.containedMenuItemSizeId,
        },
      } as ValidationError);
    }

    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    dto: UpdateMenuItemContainerItemDto,
  ): Promise<void> {
    // validate size
    if (dto.containedMenuItemId || dto.containedMenuItemSizeId) {
      const item = await this.containerService.findOne(id, [
        'containedItem',
        'containedItemsize',
      ]);
      if (!item) {
        throw new Error();
      }

      const itemId = dto.containedMenuItemId ?? item.containedItem.id;
      const sizeId = dto.containedMenuItemSizeId ?? item.containedItemsize.id;

      const menuItem = await this.itemService.findOne(itemId, ['validSizes']);
      if (!menuItem) {
        throw new Error();
      }

      if (!this.helper.isValidSize(sizeId, menuItem.validSizes)) {
        this.addError({
          errorMessage: 'Invalid menu item size',
          errorType: 'INVALID',
          contextEntity: 'UpdateMenuItemContainerItemDto',
          sourceEntity: 'MenuItemSize',
          conflictEntity: 'MenuItem',
          value: {
            containedMenuItemId: itemId,
            containedMenuItemSizeId: sizeId,
          },
        } as ValidationError);
      }
    }

    this.throwIfErrors();
  }
}
