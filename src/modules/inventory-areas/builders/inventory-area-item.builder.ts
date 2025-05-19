import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";
import { AppLogger } from "../../app-logging/app-logger";
import { InventoryItemSizeBuilder } from "../../inventory-items/builders/inventory-item-size.builder";
import { CreateInventoryItemSizeDto } from "../../inventory-items/dto/inventory-item-size/create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../../inventory-items/dto/inventory-item-size/update-inventory-item-size.dto";
import { InventoryItemSizeService } from "../../inventory-items/services/inventory-item-size.service";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateChildInventoryAreaItemDto } from "../dto/inventory-area-item/create-child-inventory-area-item.dto";
import { CreateInventoryAreaItemDto } from "../dto/inventory-area-item/create-inventory-area-item.dto";
import { UpdateChildInventoryAreaItemDto } from "../dto/inventory-area-item/update-child-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/inventory-area-item/update-inventory-area-item.dto";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";
import { InventoryAreaItemValidator } from "../validators/inventory-area-item.validator";

@Injectable()
export class InventoryAreaItemBuilder extends BuilderBase<InventoryAreaItem> 
implements IBuildChildDto<InventoryAreaCount, InventoryAreaItem>{
    constructor(
        requestContextService: RequestContextService,
        @Inject(forwardRef(() => InventoryAreaCountService))
        private readonly countService: InventoryAreaCountService,

        @Inject(forwardRef(() => InventoryAreaItemService))
        private readonly itemCountService: InventoryAreaItemService,

        logger: AppLogger,
        validator: InventoryAreaItemValidator,
        private readonly itemService: InventoryItemService,
        private readonly sizeService: InventoryItemSizeService,
        private readonly itemSizeBuilder: InventoryItemSizeBuilder,
    ){ super(InventoryAreaItem, 'InventoryAreaItemBuilder', requestContextService, logger, validator); }

    /**
     * Depreciated, only created as a child through {@link InventoryAreaCount}.
     */
    protected createEntity(dto: CreateInventoryAreaItemDto): void {
        if(dto.parentInventoryCountId){
            this.parentInventoryCountById(dto.parentInventoryCountId);
        }
        if(dto.countedInventoryItemId){
            this.countedItemById(dto.countedInventoryItemId);
        }
        if(dto.countedAmount){
            this.amount(dto.countedAmount);
        } else {
            this.amount(1); // defauilt amount
        }

        // a counted item's size can be created either on the fly, or a pre-existing item size
        if(dto.countedItemSizeDto){
            this.countedItemSizeByBuilder(dto.countedInventoryItemId, dto.countedItemSizeDto);
        }
        else if(dto.countedItemSizeId){
            this.countedItemSizeById(dto.countedItemSizeId);
        }
    }

    protected updateEntity(dto: UpdateInventoryAreaItemDto): void {
        if(dto.countedInventoryItemId){
            this.countedItemById(dto.countedInventoryItemId);
        }
        if(dto.countedAmonut){
            this.amount(dto.countedAmonut);
        }
        if(dto.countedItemSizeId){
            this.countedItemSizeById(dto.countedItemSizeId);
        }
        if(dto.countedItemSizeDto){
            this.countedItemSizeByBuilder(this.entity.countedItem.id, dto.countedItemSizeDto);
        }
    }

    buildChildEntity(dto: CreateChildInventoryAreaItemDto): void {
        if(dto.countedInventoryItemId){
            this.countedItemById(dto.countedInventoryItemId);
        }
        if(dto.countedAmount){
            this.amount(dto.countedAmount);
        }

        // a counted item's size can either be created on the fly, or a pre-existing item size
        if(dto.countedItemSizeDto){
            this.countedItemSizeByBuilder(dto.countedInventoryItemId, dto.countedItemSizeDto);
        }
        else if(dto.countedItemSizeId){
            this.countedItemSizeById(dto.countedItemSizeId);
        }
    }

    public async buildChildCreateDto(parentCount: InventoryAreaCount, dto: CreateChildInventoryAreaItemDto): Promise<InventoryAreaItem> {
        await this.validateCreateDto(dto);

        this.reset();

        this.entity.parentInventoryCount = parentCount;

        this.buildChildEntity(dto);

        return await this.build();
    }

    public async buildManyChildDto(parentCount: InventoryAreaCount, dtos: (CreateChildInventoryAreaItemDto | UpdateChildInventoryAreaItemDto)[]): Promise<InventoryAreaItem[]> {
        const results: InventoryAreaItem[] = [];
        for(const dto of dtos){
            if(dto.mode === 'create'){
                results.push(await this.buildChildCreateDto(parentCount, dto))
            } else {
                const countedItem = await this.itemCountService.findOne(dto.id, ['parentInventoryCount', 'countedItem', 'countedItemSize']);
                if(!countedItem){ throw new Error("counted item is null"); }
                results.push(await this.buildUpdateDto(countedItem, dto));
            }
        }
        return results;
    }

    public countedItemById(id: number): this {
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'countedItem', id);
    }

    public countedItemByName(name: string): this {
        return this.setPropByName(this.itemService.findOne.bind(this.itemService), 'countedItem', name);
    }

    public amount(amount: number): this {
        if(amount === 0){
            return this.setPropByVal('amount', 1);
        }
        return this.setPropByVal('amount', amount);
    }

    public countedItemSizeById(id: number): this {
        return this.setPropById(this.sizeService.findOne.bind(this.sizeService), 'countedItemSize', id);
    }

    public countedItemSizeByBuilder(inventoryItemId: number, dto: (CreateInventoryItemSizeDto | UpdateInventoryItemSizeDto)): this {
        const enrichedDto = {
            ...dto,
            inventoryItemId,
        }
        return this.setPropByBuilder(this.itemSizeBuilder.buildDto.bind(this.itemSizeBuilder), 'countedItemSize', this.entity, enrichedDto);
    }

    public parentInventoryCountById(id: number): this {
        return this.setPropById(this.countService.findOne.bind(this.countService), 'parentInventoryCount', id);
    }
}