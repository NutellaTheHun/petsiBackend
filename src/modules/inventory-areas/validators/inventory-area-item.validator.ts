import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { CreateInventoryAreaItemDto } from "../dto/inventory-area-item/create-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/inventory-area-item/update-inventory-area-item.dto";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";
import { UpdateChildInventoryAreaItemDto } from "../dto/inventory-area-item/update-child-inventory-area-item.dto";
import { ValidationError } from "../../../util/exceptions/validation-error";

@Injectable()
export class InventoryAreaItemValidator extends ValidatorBase<InventoryAreaItem> {
    constructor(
        @InjectRepository(InventoryAreaItem)
        private readonly repo: Repository<InventoryAreaItem>,

        @Inject(forwardRef(() => InventoryAreaItemService))
        private readonly areaItemService: InventoryAreaItemService,

        private readonly itemService: InventoryItemService,
    ) { super(repo); }

    public async validateCreate(dto: CreateInventoryAreaItemDto): Promise<void> {
        // Must have either itemSizeId or itemSizeDto
        if (!dto.countedItemSizeId && !dto.countedItemSizeDto) {
            this.addError({
                error: 'missing inventory item size assignment',
                status: 'MISSING',
                contextEntity: 'CreateInventoryAreaItemDto',
                sourceEntity: 'InventoryItemSize',
            } as ValidationError);
        }

        // Cannot have both itemSizeId or itemSizeDto
        else if (dto.countedItemSizeId && dto.countedItemSizeDto) {
            this.addError({
                error: 'cannot provide inventory item size and create dto',
                status: 'INVALID',
                contextEntity: 'CreateInventoryAreaItemDto',
                sourceEntity: 'InventoryItemSize',
            } as ValidationError);
        }

        //InventoryItem and ItemSize must be valid
        if (dto.countedItemSizeId) {
            const item = await this.itemService.findOne(dto.countedInventoryItemId, ['itemSizes']);

            if (!this.helper.isValidSize(dto.countedItemSizeId, item.itemSizes)) {
                this.addError({
                    error: 'inventory item size not valid for inventory item',
                    status: 'INVALID',
                    contextEntity: 'CreateInventoryAreaItemDto',
                    sourceEntity: 'InventoryItemSize',
                    sourceId: dto.countedItemSizeId,
                    conflictEntity: 'InventoryItem',
                    conflictId: item.id,
                } as ValidationError);
            }
        }

        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateInventoryAreaItemDto | UpdateChildInventoryAreaItemDto): Promise<void> {
        // Cannot update with both item size and item size dto
        if (dto.countedItemSizeId && dto.countedItemSizeDto) {
            this.addError({
                error: 'cannot provide inventory item size and create dto',
                status: 'INVALID',
                contextEntity: 'UpdateInventoryAreaItemDto',
                contextId: id,
                sourceEntity: 'InventoryItemSize',
            } as ValidationError);
        }

        // cannot update item with no sizing
        else if (dto.countedInventoryItemId && !dto.countedItemSizeId && !dto.countedItemSizeDto) {
            this.addError({
                error: 'missing inventory item size assignment',
                status: 'INVALID',
                contextEntity: 'UpdateInventoryAreaItemDto',
                contextId: id,
                sourceEntity: 'InventoryItemSize',
            } as ValidationError);
        }

        // Check if counted item and counted size are valid
        else if (dto.countedInventoryItemId || dto.countedItemSizeId && !dto.countedItemSizeDto) {
            const toUpdate = await this.areaItemService.findOne(id, ['countedItem', 'countedItemSize']);
            if (!toUpdate) { throw new Error(); }

            const itemId = dto.countedInventoryItemId ?? toUpdate.countedItem.id;
            const sizeId = dto.countedItemSizeId ?? toUpdate.countedItemSize.id;

            const item = await this.itemService.findOne(itemId, ['itemSizes']);
            if (!this.helper.isValidSize(sizeId, item.itemSizes)) {
                this.addError({
                    error: 'Invalid size for inventory item',
                    status: 'INVALID',
                    contextEntity: 'UpdateInventoryAreaItemDto',
                    contextId: id,
                    sourceEntity: 'InventoryItemSize',
                    sourceId: sizeId,
                    conflictEntity: 'InventoryItem',
                    conflictId: item.id,
                } as ValidationError);
            }
        }

        this.throwIfErrors()
    }
}
