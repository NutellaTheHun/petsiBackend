import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { NestedCreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/nested-create-menu-item-container-item.dto';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem, MenuItemEntity } from '../entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemContainerItemValidatorIdentity } from './identities/menu-item-container-item.validator.identity.interface';
import { MenuItemValidatorIdentity } from './identities/menu-item.validator.identity.interface';
import { MenuItemContainerItemValidator } from './menu-item-container-item.validator';

@Injectable()
export class MenuItemValidator extends ValidatorBase<MenuItemEntity, MenuItemValidatorIdentity> {

    constructor(
        @InjectRepository(MenuItem)
        private readonly repo: Repository<MenuItem>,

        private readonly menuItemContainerValidator: MenuItemContainerItemValidator,

        @InjectRepository(MenuItemSize)
        private readonly menuItemSizeRepo: Repository<MenuItemSize>,

        @InjectRepository(MenuItemCategory)
        private readonly categoryRepo: Repository<MenuItemCategory>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'MenuItem', requestContextService, logger);
    }

    protected async validateIdentity(identity: MenuItemValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.name) {
            await this.helper.enforceUnique(
                identity.name,
                this.repo,
                'name',
                errorMap,
                id,
            );
        }

        if (identity.categoryId !== undefined && identity.categoryId !== null) {
            await this.helper.enforceExists(
                identity.categoryId,
                this.categoryRepo,
                'category',
                errorMap,
            );
        }

        if (identity.sizeIds && identity.sizeIds.length) {
            for (const sizeId of identity.sizeIds) {
                await this.helper.enforceExists(
                    sizeId,
                    this.menuItemSizeRepo,
                    'sizes',
                    errorMap,
                );
            }
        }

        if (identity.containerMenuItems && identity.containerMenuItems.length) {
            if (identity.type !== MENU_ITEM_TYPES.CONTAINER) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['type']);
            }

            // validate no duplicates
            this.helper.enforceNoDuplicateElements(
                identity.containerMenuItems,
                (item) => ({ id: item.id ?? item.createId, identity: `${item.containedMenuItemId}:${item.containedItemSizeId}:${item.parentItemSizeId}` }),
                'containerMenuItems',
                errorMap,
            );

            // if variable max amount is set, validate container item quantities match variable max amount
            if (identity.variableMaxAmount !== undefined && identity.variableMaxAmount !== null) {
                for (const containerItem of identity.containerMenuItems) {
                    if (containerItem.quantity !== identity.variableMaxAmount) {
                        const id = containerItem.id ?? containerItem.createId;
                        if (id == null) throw new Error('id is required');
                        const childErrorMap = new ValidationErrorMap(id);
                        childErrorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['quantity']);
                        errorMap.addChild('containerMenuItems', childErrorMap);
                    }
                }
            }

            for (const containerItem of identity.containerMenuItems) {
                // validate contained menu item is not the same as the parent menu item
                if (containerItem.containedMenuItemId === identity.id) {
                    errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['containedMenuItem']);
                }

                // nested validator call
                await this.menuItemContainerValidator.validateNestedIdentity(
                    'containerMenuItems',
                    containerItem,
                    errorMap,
                );
            }
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateMenuItemDto | UpdateMenuItemDto, id: number | string): Promise<MenuItemValidatorIdentity> {
        const containerItemIdentities: MenuItemContainerItemValidatorIdentity[] = [];
        if (dto.containerMenuItems && dto.containerMenuItems.length) {
            for (const containerItem of dto.containerMenuItems) {
                const itemId = containerItem instanceof NestedCreateMenuItemContainerItemDto ? containerItem.createId : containerItem.id;
                containerItemIdentities.push(await this.menuItemContainerValidator.resolveIdentity(containerItem, itemId));
            }
        }
        return {
            name: dto.name,
            type: dto.type,
            categoryId: dto.categoryId,
            sizeIds: dto.sizeIds,
            containerMenuItems: containerItemIdentities,
            variableMaxAmount: dto.variableMaxAmount,
        } as MenuItemValidatorIdentity;

    }
}
