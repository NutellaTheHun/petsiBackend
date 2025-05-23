import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { MenuItemSizeService } from "../../menu-items/services/menu-item-size.service";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { UpdateChildOrderContainerItemDto } from "../dto/order-container-item/update-child-order-container-item.dto";
import { CreateChildOrderMenuItemDto } from "../dto/order-menu-item/create-child-order-menu-item.dto";
import { UpdateChildOrderMenuItemDto } from "../dto/order-menu-item/update-child-order-menu-item.dto";
import { UpdateOrderMenuItemDto } from "../dto/order-menu-item/update-order-menu-item.dto";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { OrderContainerItemService } from "../services/order-container-item.service";
import { OrderMenuItemService } from "../services/order-menu-item.service";

@Injectable()
export class OrderMenuItemValidator extends ValidatorBase<OrderMenuItem> {
    constructor(
        @InjectRepository(OrderMenuItem)
        private readonly repo: Repository<OrderMenuItem>,

        @Inject(forwardRef(() => OrderMenuItemService))
        private readonly orderItemService: OrderMenuItemService,

        @Inject(forwardRef(() => OrderContainerItemService))
        private readonly containerItemService: OrderContainerItemService,

        private readonly menuItemService: MenuItemService,
        private readonly sizeService: MenuItemSizeService,

    ) { super(repo); }

    public async validateCreate(dto: CreateChildOrderMenuItemDto): Promise<void> {
        const menuItem = await this.menuItemService.findOne(dto.menuItemId, ['validSizes']);
        if (!menuItem.validSizes) { throw new Error(); }

        // validate item / size
        if (!this.helper.isValidSize(dto.menuItemSizeId, menuItem.validSizes)) {
            this.addError({
                error: 'Invalid item size.',
                status: 'INVALID',
                contextEntity: 'CreateOrderMenuItemDto',
                sourceEntity: 'MenuItemSize',
                sourceId: dto.menuItemSizeId,
                conflictEntity: 'MenuItem',
                conflictId: dto.menuItemId
            } as ValidationError);
        }

        if (dto.orderedItemContainerDtos && dto.orderedItemContainerDtos.length > 0) {

            // validate container item / size
            const duplicateItems = this.helper.findDuplicates(
                dto.orderedItemContainerDtos,
                (item) => `${item.containedMenuItemId}:${item.containedMenuItemSizeId}`
            );
            if (duplicateItems) {
                for (const duplicate of duplicateItems) {
                    this.addError({
                        error: 'Order has duplicate items.',
                        status: 'DUPLICATE',
                        contextEntity: 'CreateOrderMenuItemDto',
                        sourceEntity: 'MenuItem',
                        sourceId: duplicate.containedMenuItemId,
                        conflictEntity: 'MenuItemSize',
                        conflictId: duplicate.containedMenuItemSizeId
                    } as ValidationError);
                }
            }

            //validate container parent id
            for (const item of dto.orderedItemContainerDtos) {
                if (item.parentContainerMenuItemId !== menuItem.id) {
                    this.addError({
                        error: 'Ordered container item references the incorrect parent item.',
                        status: 'INVALID',
                        contextEntity: 'CreateOrderMenuItemDto',
                        sourceEntity: 'MenuItem',
                        sourceId: item.parentContainerMenuItemId,
                        conflictEntity: 'MenuItem',
                        conflictId: dto.menuItemId
                    } as ValidationError);
                }
            }
        }

        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateOrderMenuItemDto | UpdateChildOrderMenuItemDto): Promise<void> {

        // validate item / size
        if (dto.menuItemId || dto.menuItemSizeId) {
            const currentOrderItem = await this.orderItemService.findOne(id, ['size', 'menuItem']);

            const sizeId = dto.menuItemSizeId ?? currentOrderItem.size.id;
            const itemId = dto.menuItemId ?? currentOrderItem.menuItem.id;

            const menuItem = await this.menuItemService.findOne(itemId, ['validSizes']);
            if (!menuItem) { throw new Error(); }

            if (!this.helper.isValidSize(sizeId, menuItem.validSizes)) {
                this.addError({
                    error: 'Invalid item size.',
                    status: 'INVALID',
                    contextEntity: 'UpdateOrderMenuItemDto',
                    contextId: id,
                    sourceEntity: 'MenuItemSize',
                    sourceId: dto.menuItemSizeId,
                    conflictEntity: 'MenuItem',
                    conflictId: dto.menuItemId
                } as ValidationError);
            }
        }

        // Validate container
        if (dto.orderedItemContainerDtos && dto.orderedItemContainerDtos.length > 0) {

            // resolve
            const resolvedDtos: { containedMenuItemId: number; containedMenuItemSizeId: number }[] = [];
            const resolvedIds: number[] = [];
            for (const d of dto.orderedItemContainerDtos) {
                if (d.mode === 'create') {
                    resolvedDtos.push({
                        containedMenuItemId: d.containedMenuItemId,
                        containedMenuItemSizeId: d.containedMenuItemSizeId
                    }
                    );
                }
                else if (d.mode === 'update') {
                    const updateDto = d as UpdateChildOrderContainerItemDto;
                    const currentItem = await this.containerItemService.findOne(updateDto.id, ['containedItem', 'containedItemSize']);
                    resolvedDtos.push({
                        containedMenuItemId: updateDto.containedMenuItemId ?? currentItem.containedItem.id,
                        containedMenuItemSizeId: updateDto.containedMenuItemSizeId ?? currentItem.containedItemSize.id
                    });
                    resolvedIds.push(d.id);
                }
            }

            // Check duplicate update ids
            const duplicateIds = this.helper.findDuplicates(
                resolvedIds,
                (item) => `${item}`
            );
            if (duplicateIds) {
                for (const dupId of duplicateIds) {
                    this.addError({
                        error: 'multiple update requests for same container item.',
                        status: 'INVALID',
                        contextEntity: 'UpdateOrderMenuItemDto',
                        contextId: id,
                        sourceEntity: 'UpdateChildOrderContainerItemDto',
                        sourceId: dupId,
                        conflictEntity: 'MenuItem',
                        conflictId: dto.menuItemId
                    } as ValidationError);
                }
            }

            // Check duplicate items
            const duplicateItems = this.helper.findDuplicates(
                resolvedDtos,
                (item) => `${item.containedMenuItemId}:${item.containedMenuItemSizeId}`
            );
            if (duplicateItems) {
                for (const duplicate of duplicateItems) {
                    this.addError({
                        error: 'duplicate container item.',
                        status: 'DUPLICATE',
                        contextEntity: 'UpdateOrderMenuItemDto',
                        contextId: id,
                        sourceEntity: 'MenuItem',
                        sourceId: duplicate.containedMenuItemId,
                        conflictEntity: 'MenuItemSize',
                        conflictId: duplicate.containedMenuItemSizeId,
                    } as ValidationError);
                }
            }
        }

        this.throwIfErrors()
    }
}