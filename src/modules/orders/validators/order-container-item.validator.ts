import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NestedValidatorBase } from '../../../common/base/nested-validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
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
import { OrderContainerItemValidatorIdentity } from './identities/order-container-item.validator.identity.interface';

@Injectable()
export class OrderContainerItemValidator extends NestedValidatorBase<OrderContainerItemEntity, OrderContainerItemValidatorIdentity> {

    constructor(
        @InjectRepository(OrderContainerItem)
        private readonly orderContainerItemRepo: Repository<OrderContainerItem>,

        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,

        @InjectRepository(MenuItemSize)
        private readonly menuItemSizeRepo: Repository<MenuItemSize>,

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
        return {
            id: dto instanceof NestedUpdateOrderContainerItemDto ? dto.id : undefined,
            createId: dto instanceof NestedCreateOrderContainerItemDto ? dto.createId : undefined,
            containedMenuItemId: dto.containedMenuItemId,
            containedItemSizeId: dto.containedItemSizeId,
            quantity: dto.quantity,
            parentOrderMenuItemId: dto instanceof CreateOrderContainerItemDto ? dto.parentOrderMenuItemId : undefined,
        } as OrderContainerItemValidatorIdentity;
    }

    /**
     * OrderMenuItem validator checks that contained item and size is valid in parent container, and checks that variable max amount is respected
     */
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

        // validate contained item size exists
        if (identity.containedItemSizeId) {
            this.helper.enforceExists(
                identity.containedItemSizeId,
                this.menuItemSizeRepo,
                'containedItemSize',
                errorMap,
            );
        }

        // validate contained item exists
        if (identity.containedMenuItemId) {
            this.helper.enforceExists(
                identity.containedMenuItemId,
                this.menuItemRepo,
                'containedMenuItem',
                errorMap,
            );
        }

        return errorMap;
    }
}
