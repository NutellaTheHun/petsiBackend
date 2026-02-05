import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem, MenuItemEntity } from '../entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemContainerItemAggregateValidator } from './aggregate-validators/menu-item.aggregate.validator';
import { MenuItemContainerItemValidatorIdentity } from './identities/menu-item-container-item.validator.identity.interface';
import { MenuItemValidatorIdentity } from './identities/menu-item.validator.identity.interface';
import { MenuItemContainerItemValidator } from './menu-item-container-item.validator';

@Injectable()
export class MenuItemValidator extends ValidatorBase<MenuItemEntity, MenuItemValidatorIdentity> {

    constructor(
        @InjectRepository(MenuItem)
        private readonly repo: Repository<MenuItem>,

        private readonly menuItemContainerValidator: MenuItemContainerItemValidator,

        @InjectRepository(MenuItemContainerItem)
        private readonly menuItemContainerItemRepo: Repository<MenuItemContainerItem>,

        @InjectRepository(MenuItemSize)
        private readonly menuItemSizeRepo: Repository<MenuItemSize>,

        @InjectRepository(MenuItemCategory)
        private readonly categoryRepo: Repository<MenuItemCategory>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'MenuItem', requestContextService, logger);
    }

    protected async validateIdentity(identity: MenuItemValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.name) {
            await this.helper.enforceUnique(
                identity.name,
                this.repo,
                'name',
                errorMap,
            );
        }

        if (identity.categoryId) {
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
            const miciValidator = new MenuItemContainerItemAggregateValidator(
                identity.containerMenuItems,
            );

            miciValidator.validateUnique(
                'containerMenuItems',
                errorMap,
            );

            // if variable max amount is set, validate container item quantities match variable max amount
            if (identity.variableMaxAmount) {
                for (const containerItem of identity.containerMenuItems) {
                    if (containerItem.quantity && containerItem.quantity !== identity.variableMaxAmount) {
                        errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['quantity']);
                    }
                }
            }

            // nested validator call
            for (const containerItem of identity.containerMenuItems) {
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
        // if dto has containerMenuItems and is an update, will need to fetch current container items and convert to identities,
        // can then most likely simplify/get rid of aggregate validators and merge into validator helper
        if (dto instanceof CreateMenuItemDto) {
            return {
                name: dto.name,
                type: dto.type,
                categoryId: dto.categoryId,
                sizeIds: dto.sizeIds,
                containerMenuItems: dto.containerMenuItems?.map(async (containerItem) => await this.menuItemContainerValidator.resolveIdentity(containerItem, id)) ?? undefined,
                variableMaxAmount: dto.variableMaxAmount,
            } as MenuItemValidatorIdentity;
        }

        let containerItemIdentities: MenuItemContainerItemValidatorIdentity[] = [];
        if (dto.containerMenuItems && dto.containerMenuItems.length) {
            // get current container items
            const currentContainerItems = await this.menuItemContainerItemRepo.find({
                where: { parentMenuItem: { id: Number(id) } },
                relations: ['containedMenuItem', 'containedItemSize'],
            });
            if (!currentContainerItems) {
                throw new NotFoundException();
            }

            // convert to identities
            const currentItemIdentities = await Promise.all(currentContainerItems.map(async (containerItem) => this.menuItemContainerValidator.resolveIdentity(containerItem, id)));

            // convert new items to identities
            const newItemIdentities = await Promise.all(dto.containerMenuItems.map(async (containerItem) => this.menuItemContainerValidator.resolveIdentity(containerItem, id)));

            // merge identities
            containerItemIdentities = [...currentItemIdentities, ...newItemIdentities];
        }
        return {
            name: dto.name,
            type: dto.type,
            categoryId: dto.categoryId,
            sizeIds: dto.sizeIds,
            containerMenuItems: containerItemIdentities.length ? containerItemIdentities : undefined,
            variableMaxAmount: dto.variableMaxAmount,
        } as MenuItemValidatorIdentity;


    }

    protected async doValidateCreateNode(
        dto: CreateMenuItemDto,
        id?: string,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        // name must be unique
        await this.helper.enforceUnique(
            dto.name,
            this.repo,
            'name',
            errorMap,
        );

        if (dto.containerMenuItems && dto.containerMenuItems?.length) {
            if (dto.type !== MENU_ITEM_TYPES.CONTAINER) {
                errorMap.addChild(
                    'type',
                    new ValidationErrorMap(
                        undefined,
                        'item has contained items but is not set to type container',
                    ),
                );
            }

            // validate no duplicates
            const miciValidator = new MenuItemContainerItemAggregateValidator(
                dto.containerMenuItems,
            );

            miciValidator.validateUnique(
                'containerMenuItems',
                errorMap,
                'duplicate container item',
            );

            // nested validator call
            await this.menuItemContainerValidator.validateManyNestedNode(
                'containerMenuItems',
                dto.containerMenuItems,
                errorMap,
            );
        }

        return errorMap;
    }

    protected async doValidateUpdateNode(
        dto: UpdateMenuItemDto,
        id: number,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        // exists
        if (dto.name) {
            await this.helper.enforceUnique(
                dto.name,
                this.repo,
                'name',
                errorMap,
            );
        }

        // containerItem dtos
        if (dto.containerMenuItems && dto.containerMenuItems?.length) {
            let type = dto.type;
            if (!dto.type) {
                const currentEntity = await this.repo.findOne({
                    where: { id },
                });
                if (!currentEntity) {
                    throw new NotFoundException();
                }
                type = currentEntity.type;
            }

            if (type !== MENU_ITEM_TYPES.CONTAINER) {
                // dto.type?
                errorMap.addChild(
                    'type',
                    new ValidationErrorMap(
                        undefined,
                        'item has contained items but is not set to type container',
                    ),
                );
            }

            // Get current container items
            const currentContainerItems = await this.menuItemContainerItemRepo.find({
                where: { parentMenuItem: { id } },
                relations: ['containedMenuItem', 'containedItemSize'],
            });
            if (!currentContainerItems) {
                throw new NotFoundException();
            }

            const miciValidator = new MenuItemContainerItemAggregateValidator(
                dto.containerMenuItems,
                currentContainerItems,
            );

            miciValidator.validateUnique(
                'containerMenuItems',
                errorMap,
                'duplicate container item',
            );

            // nested validator call
            await this.menuItemContainerValidator.validateManyNestedNode(
                'containerMenuItems',
                dto.containerMenuItems,
                errorMap,
            );
        }

        return errorMap;
    }
}
