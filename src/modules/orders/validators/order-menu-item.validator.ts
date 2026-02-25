import { Injectable } from '@nestjs/common';
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
import { NestedCreateOrderContainerItemDto } from '../dto/order-container-item/nested-create-order-container-item.dto';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { NestedUpdateOrderMenuItemDto } from '../dto/order-menu-item/nested-update-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../dto/order-menu-item/update-order-menu-item.dto';
import {
    OrderMenuItem,
    OrderMenuItemEntity,
} from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { OrderContainerItemValidatorIdentity } from './identities/order-container-item.validator.identity.interface';
import { OrderMenuItemValidatorIdentity } from './identities/order-menu-item.validator.identity.interface';
import { OrderContainerItemValidator } from './order-container-item.validator';

@Injectable()
export class OrderMenuItemValidator extends NestedValidatorBase<OrderMenuItemEntity, OrderMenuItemValidatorIdentity> {

    constructor(
        @InjectRepository(OrderMenuItem)
        private readonly repo: Repository<OrderMenuItem>,
        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,
        @InjectRepository(MenuItemSize)
        private readonly menuItemSizeRepo: Repository<MenuItemSize>,
        @InjectRepository(MenuItemContainerItem)
        private readonly menuItemContainerItemRepo: Repository<MenuItemContainerItem>,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,

        private readonly orderContainerItemValidator: OrderContainerItemValidator,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'OrderMenuItem', requestContextService, logger);
    }

    public async resolveIdentity(dto: CreateOrderMenuItemDto | UpdateOrderMenuItemDto | NestedCreateOrderMenuItemDto | NestedUpdateOrderMenuItemDto, id: number | string): Promise<OrderMenuItemValidatorIdentity> {
        const containerItemIdentities: OrderContainerItemValidatorIdentity[] = [];
        if (dto.containerOrderMenuItems && dto.containerOrderMenuItems.length) {
            for (const containerItem of dto.containerOrderMenuItems) {
                const itemId = containerItem instanceof NestedCreateOrderContainerItemDto ? containerItem.createId : containerItem.id;
                containerItemIdentities.push(await this.orderContainerItemValidator.resolveIdentity(containerItem, itemId));
            }
        }

        const menuItem = await this.menuItemRepo.findOne({
            where: { id: dto.menuItemId },
        });
        if (!menuItem) {
            throw new Error('MenuItem not found');
        }

        return {
            id: dto instanceof NestedUpdateOrderMenuItemDto ? dto.id : undefined,
            createId: dto instanceof NestedCreateOrderMenuItemDto ? dto.createId : undefined,
            menuItemId: dto.menuItemId,
            sizeId: dto.sizeId,
            quantity: dto.quantity,
            containerOrderMenuItems: containerItemIdentities,
            parentOrderId: dto instanceof CreateOrderMenuItemDto ? dto.parentOrderId : undefined,
            menuItemType: menuItem.type,
            variableMaxAmount: menuItem.variableMaxAmount ? menuItem.variableMaxAmount : undefined,
        } as OrderMenuItemValidatorIdentity;
    }

    protected async validateIdentity(identity: OrderMenuItemValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.menuItemId !== undefined) {
            await this.helper.enforceExists(
                identity.menuItemId,
                this.menuItemRepo,
                'menuItem',
                errorMap,
            );
        }

        if (identity.parentOrderId !== undefined) {
            await this.helper.enforceExists(
                identity.parentOrderId,
                this.orderRepo,
                'parentOrder',
                errorMap,
            );
        }

        if (identity.quantity !== undefined) {
            this.helper.enforcePositive(
                identity.quantity,
                'quantity',
                errorMap,
            );
        }

        if (identity.sizeId !== undefined) {
            await this.helper.enforceExists(
                identity.sizeId,
                this.menuItemSizeRepo,
                'size',
                errorMap,
            );
        }

        if (identity.sizeId && identity.menuItemId) {
            await this.helper.enforceValidSize(
                identity.sizeId,
                identity.menuItemId,
                this.menuItemRepo,
                'sizes',
                'size',
                errorMap,
            );
        }

        if (identity.containerOrderMenuItems && identity.containerOrderMenuItems.length) {

            // validate menu item is a container
            if (identity.menuItemType !== MENU_ITEM_TYPES.CONTAINER) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['menuItemType']);
            }

            // validate no duplicates
            this.helper.enforceNoDuplicateElements(
                identity.containerOrderMenuItems,
                (item) => ({ id: item.id ?? item.createId, identity: `${item.containedMenuItemId}:${item.containedItemSizeId}` }),
                'containerOrderMenuItems',
                errorMap,
            );

            // for variable max amount check
            let containerQuantity = 0;

            for (const item of identity.containerOrderMenuItems) {

                // accumulate quantity to check against variable max amount
                if (identity.variableMaxAmount && item.quantity) {
                    containerQuantity += item.quantity;
                }

                // contained item cannot equal parent menu item
                if (item.containedMenuItemId === identity.menuItemId) {
                    const id = item.id?.toString() ?? item.createId;
                    if (!id) {
                        throw new Error('Invalid container item id');
                    }
                    errorMap.addError('INVALID_PROPERTY_VALUE', [id], ['containerOrderMenuItems']);
                }

                // contained item and size must be valid in parent container
                const validMenuItemContainerItem = await this.menuItemContainerItemRepo.findOne({
                    where: {
                        containedMenuItem: { id: item.containedMenuItemId },
                        containedItemSize: { id: item.containedItemSizeId },
                        parentMenuItem: { id: identity.menuItemId },
                        parentItemSize: { id: identity.sizeId }
                    },
                });
                if (!validMenuItemContainerItem) {
                    const childId = item.id?.toString() ?? item.createId;
                    if (!childId) {
                        throw new Error('Invalid container item id');
                    }
                    const validItemCheck = await this.menuItemContainerItemRepo.findOne({
                        where: {
                            containedMenuItem: { id: item.containedMenuItemId },
                            parentMenuItem: { id: identity.menuItemId },
                            parentItemSize: { id: identity.sizeId }
                        },
                    });
                    if (validItemCheck) {
                        // invalid size
                        const childErrorMap = new ValidationErrorMap(childId);
                        childErrorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['containedItemSize']);
                        errorMap.addChild('containerOrderMenuItems', childErrorMap);
                    }
                    else {
                        // invalid item
                        const childErrorMap = new ValidationErrorMap(childId);
                        childErrorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['containedMenuItem']);
                        errorMap.addChild('containerOrderMenuItems', childErrorMap);
                    }
                }

                // Nested validator call
                await this.orderContainerItemValidator.validateNestedIdentity(
                    'containerOrderMenuItems',
                    item,
                    errorMap,
                );
            }

            // if variable max amount is set, validate container quantity matches variable max amount
            if (identity.variableMaxAmount) {
                if (containerQuantity !== identity.variableMaxAmount) {
                    errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['containerOrderMenuItems']);
                }
            }
        }

        return errorMap;
    }
}
