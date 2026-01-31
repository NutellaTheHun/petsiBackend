import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { NestedUpdateOrderMenuItemDto } from '../dto/order-menu-item/nested-update-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from '../dto/order-menu-item/update-order-menu-item.dto';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import {
    OrderMenuItem,
    OrderMenuItemEntity,
} from '../entities/order-menu-item.entity';
import { OrderContainerItemValidator } from './order-container-item.validator';

@Injectable()
export class OrderMenuItemValidator extends ValidatorBase<OrderMenuItemEntity> {
    constructor(
        @InjectRepository(OrderMenuItem)
        private readonly repo: Repository<OrderMenuItem>,
        @InjectRepository(OrderContainerItem)
        private readonly orderContainerItemRepo: Repository<OrderContainerItem>,
        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,

        private readonly orderContainerItemValidator: OrderContainerItemValidator,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'OrderMenuItem', requestContextService, logger);
    }

    protected async doValidateCreateNode(
        dto: CreateOrderMenuItemDto,
        id?: string,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        const menuItem = await this.menuItemRepo.findOne({
            where: { id: dto.menuItemId },
            relations: ['sizes'],
        });
        if (!menuItem) {
            throw new NotFoundException();
        }

        // validate item / size
        await this.helper.enforceValidSize(
            dto.sizeId,
            menuItem.id,
            this.menuItemRepo,
            'sizes',
            'size',
            errorMap,
            'Invalid size',
        );

        if (menuItem.type === MENU_ITEM_TYPES.CONTAINER) {
            // must have container items
            this.helper.enforceArrayNotEmpty(
                dto.containerOrderMenuItems,
                'containerOrderMenuItems',
                errorMap,
                'container must have at least one item',
            );
        }

        if (dto.containerOrderMenuItems && dto.containerOrderMenuItems?.length) {
            // validate no duplicates
            this.helper.enforceNoDuplicateElements(
                dto.containerOrderMenuItems,
                (item) => `${item.containedMenuItemId}:${item.containedItemSizeId}`,
                'containerOrderMenuItems',
                errorMap,
                'duplicate container item',
            );

            // validate container quantity based on variableMax
            if (menuItem.variableMaxAmount) {
                const totalQuantity = dto.containerOrderMenuItems.reduce(
                    (acc, item) => acc + item.quantity,
                    0,
                );
                if (totalQuantity !== menuItem.variableMaxAmount) {
                    errorMap.addChild(
                        'quantity',
                        new ValidationErrorMap(
                            undefined,
                            'quantity must equal the variable max amount of the container',
                        ),
                    );
                }
            }

            // Nested validator call
            await this.orderContainerItemValidator.validateManyNestedNode(
                'containerOrderMenuItems',
                dto.containerOrderMenuItems,
                errorMap,
            );
        }
        return errorMap;
    }

    protected async doValidateNestedCreateNode(
        dto: NestedCreateOrderMenuItemDto,
        id: string,
    ): Promise<ValidationErrorMap> {
        // Currently no difference in validation between nested create and root create
        return await this.doValidateCreateNode(
            dto as unknown as CreateOrderMenuItemDto,
            id,
        );
    }

    protected async doValidateUpdateNode(
        dto: UpdateOrderMenuItemDto,
        id: number,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        const currentOrderItem = await this.repo.findOne({
            where: { id },
            relations: ['size', 'menuItem'],
        });
        if (!currentOrderItem) {
            throw new NotFoundException();
        }

        // validate item / size
        if (dto.menuItemId || dto.sizeId) {
            const sizeId = dto.sizeId ?? currentOrderItem.size.id;
            const itemId = dto.menuItemId ?? currentOrderItem.menuItem.id;

            await this.helper.enforceValidSize(
                sizeId,
                itemId,
                this.menuItemRepo,
                'sizes',
                'size',
                errorMap,
                'Invalid size',
            );
        }

        if (dto.quantity) {
            this.helper.enforcePositive(
                dto.quantity,
                'quantity',
                errorMap,
                'Invalid quantity',
            );
        }

        if (dto.containerOrderMenuItems && dto.containerOrderMenuItems?.length) {
            // validate menu item is a container
            if (currentOrderItem.menuItem.type !== MENU_ITEM_TYPES.CONTAINER) {
                errorMap.addChild(
                    'menuItem',
                    new ValidationErrorMap(undefined, 'menu item is not a container'),
                );
            }

            // validate container items are not duplicates

            // Get current container items
            const currentContainerItems = await this.orderContainerItemRepo.find({
                where: { parentOrderMenuItem: { id } },
                relations: ['containedMenuItem', 'containedItemSize'],
            });
            if (!currentContainerItems) {
                throw new NotFoundException();
            }

            // map to combine current contained items with items from DTO
            const containerItemsMap = new Map<
                string | number,
                {
                    containedMenuItemId: number;
                    containedItemSizeId: number;
                    quantity: number;
                }
            >();

            // add current container items to map
            for (const item of currentContainerItems) {
                containerItemsMap.set(item.id, {
                    containedMenuItemId: item.containedMenuItem.id,
                    containedItemSizeId: item.containedItemSize.id,
                    quantity: item.quantity,
                });
            }

            // add items from DTO to map
            for (const item of dto.containerOrderMenuItems) {
                if ('id' in item) {
                    const current = containerItemsMap.get(item.id);
                    if (!current) {
                        throw new NotFoundException();
                    }
                    // if update dto, set values from dto if present, otherwise use current values
                    containerItemsMap.set(item.id, {
                        containedMenuItemId:
                            item.containedMenuItemId ?? current.containedMenuItemId,
                        containedItemSizeId:
                            item.containedItemSizeId ?? current.containedItemSizeId,
                        quantity: item.quantity ?? current.quantity,
                    });
                } else if ('createId' in item) {
                    // add create items to map
                    containerItemsMap.set(item.createId, {
                        containedMenuItemId: item.containedMenuItemId,
                        containedItemSizeId: item.containedItemSizeId,
                        quantity: item.quantity,
                    });
                }
            }

            // validate container quantity based on variableMax
            if (currentOrderItem.menuItem.variableMaxAmount) {
                const totalQuantity = Array.from(containerItemsMap.values()).reduce(
                    (acc, item) => acc + item.quantity,
                    0,
                );
                if (totalQuantity !== currentOrderItem.menuItem.variableMaxAmount) {
                    errorMap.addChild(
                        'quantity',
                        new ValidationErrorMap(
                            undefined,
                            'quantity must equal the variable max amount of the container',
                        ),
                    );
                }
            }

            // validate no duplicates from map values (with create dto items and updated dto items)
            this.helper.enforceNoDuplicateElements(
                Array.from(containerItemsMap.values()),
                (item) => `${item.containedMenuItemId}:${item.containedItemSizeId}`,
                'containerOrderMenuItems',
                errorMap,
                'duplicate container item',
            );

            // nested validator call
            await this.orderContainerItemValidator.validateManyNestedNode(
                'containerOrderMenuItems',
                dto.containerOrderMenuItems,
                errorMap,
            );
        }

        return errorMap;
    }

    protected async doValidateNestedUpdateNode(
        dto: NestedUpdateOrderMenuItemDto,
        id: number,
    ): Promise<ValidationErrorMap> {
        // Currently no difference in validation between nested update and root update
        return await this.doValidateUpdateNode(
            dto as unknown as UpdateOrderMenuItemDto,
            id,
        );
    }
}
