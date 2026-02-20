import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NestedValidatorBase } from '../../../common/base/nested-validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import { NestedCreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-create-menu-item-container-item.dto';
import { NestedUpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-update-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import {
    MenuItemContainerItem,
    MenuItemContainerItemEntity,
} from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemContainerItemValidatorIdentity } from './identities/menu-item-container-item.validator.identity.interface';

@Injectable()
export class MenuItemContainerItemValidator extends NestedValidatorBase<MenuItemContainerItemEntity, MenuItemContainerItemValidatorIdentity> {

    constructor(
        @InjectRepository(MenuItemContainerItem)
        private readonly containerItemRepo: Repository<MenuItemContainerItem>,

        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,

        @InjectRepository(MenuItemSize)
        private readonly menuItemSizeRepo: Repository<MenuItemSize>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(
            containerItemRepo,
            'MenuItemContainerItem',
            requestContextService,
            logger,
        );
    }

    public async resolveIdentity(dto: CreateMenuItemContainerItemDto | UpdateMenuItemContainerItemDto | NestedCreateMenuItemContainerItemDto | NestedUpdateMenuItemContainerItemDto, id: number | string): Promise<MenuItemContainerItemValidatorIdentity> {
        return {
            containedMenuItemId: dto.containedMenuItemId,
            containedItemSizeId: dto.containedItemSizeId,
            quantity: dto.quantity,
            parentMenuItemId: dto instanceof CreateMenuItemContainerItemDto ? dto.parentMenuItemId : undefined,
            parentItemSizeId: dto instanceof CreateMenuItemContainerItemDto || dto instanceof NestedCreateMenuItemContainerItemDto ? dto.parentItemSizeId : undefined,
        } as MenuItemContainerItemValidatorIdentity;
    }

    protected async validateIdentity(identity: MenuItemContainerItemValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.containedItemSizeId !== undefined) {
            // validate exists
            await this.helper.enforceExists(
                identity.containedItemSizeId,
                this.menuItemSizeRepo,
                'containedItemSize',
                errorMap,
            );
        }

        if (identity.containedMenuItemId !== undefined) {
            // validate exists
            await this.helper.enforceExists(
                identity.containedMenuItemId,
                this.menuItemRepo,
                'containedMenuItem',
                errorMap,
            );

            // validate is single
            await this.helper.enforcePropertyState(
                identity.containedMenuItemId,
                'type',
                MENU_ITEM_TYPES.SINGLE,
                this.menuItemRepo,
                errorMap,
            );
        }

        if (identity.parentItemSizeId !== undefined) {
            // validate exists
            await this.helper.enforceExists(
                identity.parentItemSizeId,
                this.menuItemSizeRepo,
                'parentItemSize',
                errorMap,
            );
        }

        if (identity.parentMenuItemId !== undefined) {
            // validate exists
            await this.helper.enforceExists(
                identity.parentMenuItemId,
                this.menuItemRepo,
                'parentMenuItem',
                errorMap,
            );
            // validate is container
            await this.helper.enforcePropertyState(
                identity.parentMenuItemId,
                'type',
                MENU_ITEM_TYPES.CONTAINER,
                this.menuItemRepo,
                errorMap,
            );
        }

        if (identity.quantity !== undefined) {
            // must be greater than 0
            this.helper.enforcePositive(
                identity.quantity,
                'quantity',
                errorMap,
            );
        }

        // validate contained item / size combination
        if (identity.containedItemSizeId && identity.containedMenuItemId) {
            await this.helper.enforceValidSize(
                identity.containedItemSizeId,
                identity.containedMenuItemId,
                this.menuItemRepo,
                'sizes',
                'containedItemSize',
                errorMap,
            );
        }

        // validate parent item / size combination
        if (identity.parentItemSizeId && identity.parentMenuItemId) {
            await this.helper.enforceValidSize(
                identity.parentItemSizeId,
                identity.parentMenuItemId,
                this.menuItemRepo,
                'sizes',
                'parentItemSize',
                errorMap,
            );
        }

        return errorMap;
    }
}
