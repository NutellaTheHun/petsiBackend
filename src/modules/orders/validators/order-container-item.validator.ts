import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NestedValidatorBase } from '../../../common/base/nested-validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderContainerItemDto } from '../dto/order-container-item/create-order-container-item.dto';
import { NestedCreateOrderContainerItemDto } from '../dto/order-container-item/nested-create-order-container-item.dto';
import { NestedUpdateOrderContainerItemDto } from '../dto/order-container-item/nested-update-order-container-item.dto';
import { UpdateOrderContainerItemDto } from '../dto/order-container-item/update-order-container-item.dto';
import {
    OrderContainerItem,
    OrderContainerItemEntity,
} from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { OrderContainerItemValidatorIdentity } from './validation-identities/order-container-item.validator.identity.interface';

@Injectable()
export class OrderContainerItemValidator extends NestedValidatorBase<OrderContainerItemEntity, OrderContainerItemValidatorIdentity> {

    constructor(
        @InjectRepository(OrderContainerItem)
        private readonly orderContainerItemRepo: Repository<OrderContainerItem>,

        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,

        @InjectRepository(MenuItemSize)
        private readonly menuItemSizeRepo: Repository<MenuItemSize>,

        @InjectRepository(MenuItemContainerItem)
        private readonly menuItemContainerItemRepo: Repository<MenuItemContainerItem>,

        @InjectRepository(OrderMenuItem)
        private readonly orderMenuItemRepo: Repository<OrderMenuItem>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(
            orderContainerItemRepo,
            'OrderContainerItem',
            requestContextService,
            logger,
        );
    }

    public async resolveIdentity(dto: CreateOrderContainerItemDto | UpdateOrderContainerItemDto | NestedCreateOrderContainerItemDto | NestedUpdateOrderContainerItemDto, id: number | string): Promise<OrderContainerItemValidatorIdentity> {

        if (dto instanceof CreateOrderContainerItemDto) {
            const parentMenuItem = await this.orderMenuItemRepo.findOne({
                where: { id: dto.parentOrderMenuItemId },
                relations: ['menuItem', 'size', 'menuItem.containerMenuItems', 'menuItem.containerMenuItems.containedItem', 'menuItem.containerMenuItems.containedItemSize'],
            });
            if (!parentMenuItem) {
                throw new NotFoundException();
            }

            const containedItem = await this.menuItemRepo.findOne({
                where: { id: dto.containedMenuItemId },
            });
            if (!containedItem) {
                throw new NotFoundException();
            }

            return {
                containedMenuItemId: dto.containedMenuItemId,
                containedItemSizeId: dto.containedItemSizeId,
                containedItemType: containedItem.type,
                quantity: dto.quantity,
                parentOrderMenuItemId: dto.parentOrderMenuItemId,
                parentMenuItemType: MENU_ITEM_TYPES.CONTAINER,
                parentMenuItemId: parentMenuItem.menuItem.id,
                parentMenuItemSizeId: parentMenuItem.size.id,
                variableMaxAmount: parentMenuItem.menuItem.variableMaxAmount ?? null,
            };
        }
    }

    protected async validateIdentity(identity: OrderContainerItemValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        // validate parent order menu item exists
        if (identity.parentOrderMenuItemId) {
            this.helper.enforceExists(
                identity.parentOrderMenuItemId,
                this.orderMenuItemRepo,
                'parentOrderMenuItem',
                errorMap,
            );
        }

        // validate quantity is positive
        if (identity.quantity) {
            this.helper.enforcePositive(
                identity.quantity,
                'quantity',
                errorMap,
            );
        }

        // validate contained item is type single
        if (identity.containedItemType) {
            if (identity.containedItemType !== MENU_ITEM_TYPES.SINGLE) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['containedMenuItem']);
            }
        }

        // validate quantity is less than or equal to variable max amount
        if (identity.variableMaxAmount && identity.quantity) {
            if (identity.quantity > identity.variableMaxAmount) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['quantity']);
            }
        }

        // validate containedItem and size is valid in parent container
        if (identity.parentMenuItemId && identity.parentMenuItemSizeId) {
            const validContainerItems = await this.menuItemContainerItemRepo.find({
                where: { parentMenuItem: { id: identity.parentMenuItemId }, parentItemSize: { id: identity.parentMenuItemSizeId } },
                relations: ['containedMenuItem', 'containedItemSize'],
            });

            const exists = validContainerItems.find(x => x.containedMenuItem.id === identity.containedMenuItemId && x.containedItemSize.id === identity.containedItemSizeId);
            if (!exists) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize', 'containedMenuItem']);
            }
        }

        return errorMap;
    }



    protected async doValidateCreateNode(
        dto: CreateOrderContainerItemDto,
        id?: string,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        // Validate Contained item
        const containedItem = await this.menuItemRepo.findOne({
            where: { id: dto.containedMenuItemId },
            relations: ['sizes'],
        });
        if (!containedItem) {
            throw new NotFoundException();
        }
        // contained item type single
        if (containedItem.type !== MENU_ITEM_TYPES.SINGLE) {
            errorMap.addChild(
                'type',
                new ValidationErrorMap(
                    undefined,
                ),
            );
        }

        // validate contained item / size combination
        this.helper.enforceValueInList(
            dto.containedItemSizeId,
            containedItem.sizes.map((x) => x.id),
            'containedItemSize',
            errorMap,
        );

        const parentOrderMenuItem = await this.orderMenuItemRepo.findOne({
            where: { id: dto.parentOrderMenuItemId },
            relations: [
                'menuItem',
                'size',
                'menuItem.sizes',
                'menuItem.containerMenuItems',
            ],
        });
        if (!parentOrderMenuItem) {
            throw new NotFoundException();
        }

        const parentMenuItem = parentOrderMenuItem.menuItem;

        if (parentMenuItem.type !== MENU_ITEM_TYPES.CONTAINER) {
            errorMap.addChild(
                'type',
                new ValidationErrorMap(
                    undefined,
                    'parent item must be of type container',
                ),
            );
        }

        // Validate contained item and size is valid in parent container
        const containedItemSizeCombination = `${dto.containedMenuItemId}:${dto.containedItemSizeId}`;
        this.helper.enforceValueInList(
            containedItemSizeCombination,
            parentMenuItem.containerMenuItems.map(
                (x) => `${x.containedMenuItem.id}:${x.containedItemSize.id}`,
            ),
            'containedItemSize',
            errorMap,
            'Invalid size for container',
        );

        // validate parent menu item is not equal to contained menu item
        if (parentMenuItem.id === containedItem.id) {
            errorMap.addChild(
                'parentMenuItem',
                new ValidationErrorMap(
                    undefined,
                    'parent menu item cannot be equal to contained menu item',
                ),
            );
        }

        // validate quantity is greater than 0
        this.helper.enforcePositive(
            dto.quantity,
            'quantity',
            errorMap,
            'quantity must be greater than 0',
        );

        if (parentMenuItem.variableMaxAmount) {
            if (dto.quantity !== parentMenuItem.variableMaxAmount) {
                errorMap.addChild(
                    'quantity',
                    new ValidationErrorMap(
                        undefined,
                        'quantity must be less than or equal to the variable max amount',
                    ),
                );
            }
        }

        return errorMap;
    }

    protected async doValidateNestedCreateNode(
        dto: NestedCreateOrderContainerItemDto,
        id: string,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        // Validate Contained item
        const containedItem = await this.menuItemRepo.findOne({
            where: { id: dto.containedMenuItemId },
            relations: ['sizes'],
        });
        if (!containedItem) {
            throw new NotFoundException();
        }
        // contained item type single
        if (containedItem.type !== MENU_ITEM_TYPES.SINGLE) {
            errorMap.addChild(
                'type',
                new ValidationErrorMap(
                    undefined,
                    'Only items of type single can be in a container',
                ),
            );
        }

        // validate contained item / size combination
        this.helper.enforceValueInList(
            dto.containedItemSizeId,
            containedItem.sizes.map((x) => x.id),
            'containedItemSize',
            errorMap,
            'Invalid size',
        );

        // validate quantity is greater than 0
        this.helper.enforcePositive(
            dto.quantity,
            'quantity',
            errorMap,
            'quantity must be greater than 0',
        );

        return errorMap;
    }

    protected async doValidateUpdateNode(
        dto: UpdateOrderContainerItemDto,
        id: number,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        const currentEntity = await this.orderContainerItemRepo.findOne({
            where: { id },
            relations: [
                'containedItem',
                'containedItemSize',
                'parentOrderMenuItem',
                'parentOrderMenuItem.menuItem',
            ],
        });
        if (!currentEntity) {
            throw new Error();
        }

        const parentContainer = await this.menuItemRepo.findOne({
            where: { id: currentEntity.parentOrderMenuItem.menuItem.id },
            relations: [
                'containerMenuItems',
                'containerMenuItems.containedItem',
                'containerMenuItems.containedItemSize',
            ],
        });
        if (!parentContainer) {
            throw new NotFoundException();
        }

        // Validate new MenuItem / Size combination
        if (dto.containedMenuItemId || dto.containedItemSizeId) {
            const containedItemId =
                dto.containedMenuItemId ?? currentEntity.containedMenuItem.id;
            const containedItemSizeId =
                dto.containedItemSizeId ?? currentEntity.containedItemSize.id;

            const containedItem = await this.menuItemRepo.findOne({
                where: { id: containedItemId },
                relations: ['sizes'],
            });
            if (!containedItem) {
                throw new NotFoundException();
            }

            // validate contained item type is single
            if (containedItem.type !== MENU_ITEM_TYPES.SINGLE) {
                errorMap.addChild(
                    'containedMenuItem',
                    new ValidationErrorMap(
                        undefined,
                        'contained item must be of type single',
                    ),
                );
            }

            // validate parent item is not equal to contained item
            if (parentContainer.id === containedItem.id) {
                errorMap.addChild(
                    'parentMenuItem',
                    new ValidationErrorMap(
                        undefined,
                        'parent menu item cannot be equal to contained menu item',
                    ),
                );
            }

            // validate item size is valid for contained item
            this.helper.enforceValueInList(
                containedItemSizeId,
                containedItem.sizes.map((x) => x.id),
                'containedItemSize',
                errorMap,
                'Invalid size',
            );

            // must be valid in parent container
            this.helper.enforceValueInList(
                `${containedItemId}:${containedItemSizeId}`,
                parentContainer.containerMenuItems.map(
                    (x) => `${x.containedMenuItem.id}:${x.containedItemSize.id}`,
                ),
                'containedItemSize',
                errorMap,
                'Invalid size for container',
            );
        }

        // validate quantity
        if (dto.quantity) {
            this.helper.enforcePositive(
                dto.quantity,
                'quantity',
                errorMap,
                'quantity must be greater than 0',
            );

            if (parentContainer.variableMaxAmount) {
                if (dto.quantity !== parentContainer.variableMaxAmount) {
                    errorMap.addChild(
                        'quantity',
                        new ValidationErrorMap(
                            undefined,
                            'quantity must be equal to the variable max amount',
                        ),
                    );
                }
            }
        }

        return errorMap;
    }

    protected async doValidateNestedUpdateNode(
        dto: NestedUpdateOrderContainerItemDto,
        id: number,
    ): Promise<ValidationErrorMap> {
        // Currently no difference in validation between nested update and root update
        return await this.doValidateUpdateNode(
            dto as unknown as UpdateOrderContainerItemDto,
            id,
        );
    }
}
