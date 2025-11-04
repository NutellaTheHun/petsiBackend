import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import {
  MenuItemContainerItem,
  MenuItemContainerItemEntity,
} from '../entities/menu-item-container-item.entity';
import { MenuItemContainerItemService } from '../services/menu-item-container-item.service';
import { MenuItemService } from '../services/menu-item.service';

@Injectable()
export class MenuItemContainerItemValidator extends ValidatorBase<MenuItemContainerItemEntity> {
  constructor(
    @InjectRepository(MenuItemContainerItem)
    private readonly repo: Repository<MenuItemContainerItem>,

    @Inject(forwardRef(() => MenuItemContainerItemService))
    private readonly containerService: MenuItemContainerItemService,

    @Inject(forwardRef(() => MenuItemService))
    private readonly itemService: MenuItemService,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'MenuItemContainerItem', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateMenuItemContainerItemDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // validate container item size
    const item = await this.itemService.findOne(dto.containedMenuItemId, [
      'validSizes',
    ]);
    if (!item) {
      throw new Error();
    }
    if (!this.helper.isValidSize(dto.containedItemSizeId, item.validSizes)) {
      const err = new ValidationErrorNode(
        'containedItemSize',
        id,
        'Invalid size',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateMenuItemContainerItemDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // validate size
    if ((dto.containedItemId || dto.containedItemSizeId) && id) {
      const item = await this.containerService.findOne(id, [
        'containedItem',
        'containedItemSize',
      ]);
      if (!item) {
        throw new Error();
      }

      const itemId = dto.containedItemId ?? item.containedItem.id;
      const sizeId = dto.containedItemSizeId ?? item.containedItemSize.id;

      const menuItem = await this.itemService.findOne(itemId, ['validSizes']);
      if (!menuItem) {
        throw new Error();
      }

      if (!this.helper.isValidSize(sizeId, menuItem.validSizes)) {
        const err = new ValidationErrorNode(
          'containedItemSize',
          id,
          'Invalid size',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }
}
