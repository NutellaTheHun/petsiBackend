import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
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

@Injectable()
export class OrderContainerItemValidator extends ValidatorBase<OrderContainerItemEntity> {
    constructor(
        @InjectRepository(OrderContainerItem)
        private readonly orderContainerItemRepo: Repository<OrderContainerItem>,

        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,

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
