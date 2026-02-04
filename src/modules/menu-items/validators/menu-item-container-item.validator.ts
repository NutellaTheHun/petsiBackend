import { Injectable, NotFoundException } from '@nestjs/common';
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
        if (dto instanceof CreateMenuItemContainerItemDto) {
            const parentItem = await this.menuItemRepo.findOne({
                where: { id: dto.parentMenuItemId },
            });
            if (!parentItem) {
                throw new Error();
            }
            return {
                containedItemSizeId: dto.containedItemSizeId,
                containedMenuItemId: dto.containedMenuItemId,
                parentItemSizeId: dto.parentItemSizeId,
                parentMenuItemId: dto.parentMenuItemId,
                quantity: dto.quantity,
                parentVariableMaxAmount: parentItem.variableMaxAmount,
            } as MenuItemContainerItemValidatorIdentity;
        }

        if (dto instanceof NestedCreateMenuItemContainerItemDto) {
            return {
                createId: dto.createId,
                containedItemSizeId: dto.containedItemSizeId,
                containedMenuItemId: dto.containedMenuItemId,
                parentItemSizeId: dto.parentItemSizeId,
                parentMenuItemId: 0,
                quantity: dto.quantity,
            } as MenuItemContainerItemValidatorIdentity;
        }

        const currentEntity = await this.containerItemRepo.findOne({
            where: { id: dto instanceof NestedUpdateMenuItemContainerItemDto ? dto.id : id as number },
            relations: [
                'containedMenuItem',
                'containedItemSize',
            ],
        });
        if (!currentEntity) {
            throw new Error();
        }

        let containedItemId: number | null = null;
        let containedItemSizeId: number | null = null;
        if (dto.containedItemSizeId || dto.containedMenuItemId) {
            containedItemId = dto.containedMenuItemId ?? currentEntity.containedMenuItem.id;
            containedItemSizeId = dto.containedItemSizeId ?? currentEntity.containedItemSize.id;
        }

        return {
            id: dto instanceof NestedUpdateMenuItemContainerItemDto ? dto.id : undefined,
            containedItemSizeId: containedItemSizeId ?? undefined,
            containedMenuItemId: containedItemId ?? undefined,
            quantity: dto.quantity,
        } as MenuItemContainerItemValidatorIdentity;

    }

    protected async validateIdentity(identity: MenuItemContainerItemValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.containedItemSizeId) {
            // validate exists
            await this.helper.enforceExists(
                identity.containedItemSizeId,
                this.menuItemSizeRepo,
                'containedItemSize',
                errorMap,
            );
        }

        if (identity.containedMenuItemId) {
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

        if (identity.parentItemSizeId) {
            // validate exists
            await this.helper.enforceExists(
                identity.parentItemSizeId,
                this.menuItemSizeRepo,
                'parentItemSize',
                errorMap,
            );
        }

        if (identity.parentMenuItemId) {
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

        if (identity.quantity) {
            // must be greater than 0
            this.helper.enforcePositive(
                identity.quantity,
                'quantity',
                errorMap,
            );
        }

        // validate contained item / size combination
        if (identity.containedItemSizeId || identity.containedMenuItemId) {
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
        if (identity.parentItemSizeId || identity.parentMenuItemId) {
            if (identity.parentMenuItemId !== 0) {
                await this.helper.enforceValidSize(
                    identity.parentItemSizeId,
                    identity.parentMenuItemId,
                    this.menuItemRepo,
                    'sizes',
                    'parentItemSize',
                    errorMap,
                );
            }
        }

        // validate quantity equals parent variable max amount
        if (identity.parentVariableMaxAmount) {
            if (identity.quantity !== identity.parentVariableMaxAmount) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['quantity']);
            }
        }

        return errorMap;
    }

    protected async doValidateCreateNode(
        dto: CreateMenuItemContainerItemDto,
        id?: string,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        const containedItem = await this.menuItemRepo.findOne({
            where: { id: dto.containedMenuItemId },
            relations: ['sizes'],
        });
        if (!containedItem) {
            throw new Error();
        }

        // Contained items must be of type single (no containers in containers)
        if (containedItem.type !== MENU_ITEM_TYPES.SINGLE) {
            errorMap.addChild(
                'containedMenuItem',
                new ValidationErrorMap(
                    undefined,
                ),
            );
        }

        // valid container item / size
        await this.helper.enforceValidSize(
            dto.containedItemSizeId,
            containedItem.id,
            this.menuItemRepo,
            'sizes',
            'containedItemSize',
            errorMap,
        );

        const parentItem = await this.menuItemRepo.findOne({
            where: { id: dto.parentMenuItemId },
            relations: ['sizes'],
        });
        if (!parentItem) {
            throw new Error();
        }

        // parent item must be a container
        if (parentItem.type !== MENU_ITEM_TYPES.CONTAINER) {
            errorMap.addChild(
                'parentMenuItem',
                new ValidationErrorMap(
                    undefined,
                ),
            );
        }

        // validate parent item / size
        await this.helper.enforceValidSize(
            dto.parentItemSizeId,
            parentItem.id,
            this.menuItemRepo,
            'sizes',
            'parentItemSize',
            errorMap,

        );

        // validate parent item is not equal to contained item
        if (parentItem.id === containedItem.id) {
            errorMap.addChild(
                'parentMenuItem',
                new ValidationErrorMap(
                    undefined,

                ),
            );
        }

        // validate quanitity
        this.helper.enforcePositive(
            dto.quantity,
            'quantity',
            errorMap,
        );

        // if container is set to variable max amount, quantity must equal the variable max amount
        if (parentItem.variableMaxAmount) {
            if (dto.quantity !== parentItem.variableMaxAmount) {
                errorMap.addChild(
                    'quantity',
                    new ValidationErrorMap(
                        undefined,
                        'quantity must equal the variable max amount of the container',
                    ),
                );
            }
        }

        return errorMap;
    }

    protected async doValidateNestedCreateNode(
        dto: NestedCreateMenuItemContainerItemDto,
        id: string,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        const containedItem = await this.menuItemRepo.findOne({
            where: { id: dto.containedMenuItemId },
            relations: ['sizes'],
        });
        if (!containedItem) {
            throw new Error();
        }

        // Contained items must be of type single (no containers in containers)
        if (containedItem.type !== MENU_ITEM_TYPES.SINGLE) {
            errorMap.addChild(
                'containedMenuItem',
                new ValidationErrorMap(
                    undefined,
                    'contained item must be of type single',
                ),
            );
        }

        // valid container item / size
        await this.helper.enforceValidSize(
            dto.containedItemSizeId,
            containedItem.id,
            this.menuItemRepo,
            'sizes',
            'containedItemSize',
            errorMap,
        );

        // validate quanitity
        this.helper.enforcePositive(
            dto.quantity,
            'quantity',
            errorMap,
        );

        return errorMap;
    }

    protected async doValidateUpdateNode(
        dto: UpdateMenuItemContainerItemDto,
        id: number,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        const containerEntity = await this.containerItemRepo.findOne({
            where: { id },
            relations: [
                'containedMenuItem',
                'containedItemSize',
                'containedMenuItem.parentMenuItem',
                'containedMenuItem.parentItemSize',
            ],
        });
        if (!containerEntity) {
            throw new Error(
                `MenuItemContainerItem validation: entity to update with id ${id} not found`,
            );
        }

        // Validate new contained item / item size combination
        if (dto.containedMenuItemId || dto.containedItemSizeId) {
            const containedItemId =
                dto.containedMenuItemId ?? containerEntity.containedMenuItem.id;

            const containedItemSizeId =
                dto.containedItemSizeId ?? containerEntity.containedItemSize.id;

            await this.helper.enforceValidSize(
                containedItemSizeId,
                containedItemId,
                this.menuItemRepo,
                'sizes',
                'containedItemSize',
                errorMap,
            );
        }

        if (dto.containedMenuItemId) {
            const containedItem = await this.menuItemRepo.findOne({
                where: { id: dto.containedMenuItemId },
            });
            if (!containedItem) {
                throw new NotFoundException();
            }

            // Validate contained item type is single
            if (containedItem.type !== MENU_ITEM_TYPES.SINGLE) {
                errorMap.addChild(
                    'containedMenuItem',
                    new ValidationErrorMap(
                        undefined,
                    ),
                );
            }

            // validate contained item doesnt equal parent item
            if (containedItem.id === containerEntity.parentMenuItem.id) {
                errorMap.addChild(
                    'containedMenuItem',
                    new ValidationErrorMap(
                        undefined,
                    ),
                );
            }
        }

        if (dto.quantity) {
            // must be greater than 0
            this.helper.enforcePositive(
                dto.quantity,
                'quantity',
                errorMap,
            );

            // if container is set to variable max amount, quantity must equal the variable max amount
            if (containerEntity.parentMenuItem.variableMaxAmount) {
                if (dto.quantity !== containerEntity.parentMenuItem.variableMaxAmount) {
                    errorMap.addChild(
                        'quantity',
                        new ValidationErrorMap(
                            undefined,
                        ),
                    );
                }
            }
        }

        return errorMap;
    }

    protected async doValidateNestedUpdateNode(
        dto: NestedUpdateMenuItemContainerItemDto,
        id: number,
    ): Promise<ValidationErrorMap> {
        // Currently no difference in validation between nested update and root update
        return await this.doValidateUpdateNode(
            dto as unknown as UpdateMenuItemContainerItemDto,
            id,
        );
    }
}
