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

    protected createEntity(dto: CreateInventoryAreaItemDto): void {
        if(dto.areaCountId){
            this.areaCountById(dto.areaCountId);
        }
        if(dto.inventoryItemId){
            this.inventoryItemById(dto.inventoryItemId);
        }
        if(dto.unitAmount){
            this.unitAmount(dto.unitAmount);
        } else {
            this.unitAmount(1); // defauilt amount
        }

        // a counted item's size can be created either on the fly, or a pre-existing item size
        if(dto.itemSizeDto){
            this.sizeByBuilder(dto.inventoryItemId, dto.itemSizeDto);
        }
        else if(dto.itemSizeId){
            this.sizeById(dto.itemSizeId);
        }
    }

    protected updateEntity(dto: UpdateInventoryAreaItemDto): void {
        if(dto.areaCountId){
            this.areaCountById(dto.areaCountId);
        }
        if(dto.inventoryItemId){
            this.inventoryItemById(dto.inventoryItemId);
        }
        if(dto.unitAmount){
            this.unitAmount(dto.unitAmount);
        }
        if(dto.itemSizeId){
            this.sizeById(dto.itemSizeId);
        }
        if(dto.itemSizeDto){
            this.sizeByBuilder(this.entity.item.id, dto.itemSizeDto);
        }
    }

    buildChildEntity(dto: CreateChildInventoryAreaItemDto): void {
        if(dto.inventoryItemId){
            this.inventoryItemById(dto.inventoryItemId);
        }
        if(dto.unitAmount){
            this.unitAmount(dto.unitAmount);
        }

        // a counted item's size can either be created on the fly, or a pre-existing item size
        if(dto.itemSizeDto){
            this.sizeByBuilder(dto.inventoryItemId, dto.itemSizeDto);
        }
        else if(dto.itemSizeId){
            this.sizeById(dto.itemSizeId);
        }
    }

    public async buildChildCreateDto(parentCount: InventoryAreaCount, dto: CreateChildInventoryAreaItemDto): Promise<InventoryAreaItem> {
        await this.validateCreateDto(dto);

        this.reset();

        this.entity.areaCount = parentCount;

        this.buildChildEntity(dto);

        return await this.build();
    }

    public async buildManyChildDto(parentCount: InventoryAreaCount, dtos: (CreateChildInventoryAreaItemDto | UpdateChildInventoryAreaItemDto)[]): Promise<InventoryAreaItem[]> {
        const results: InventoryAreaItem[] = [];
        for(const dto of dtos){
            if(dto.mode === 'create'){
                results.push(await this.buildChildCreateDto(parentCount, dto))
            } else {
                const countedItem = await this.itemCountService.findOne(dto.id, ['areaCount', 'item', 'size']);
                if(!countedItem){ throw new Error("counted item is null"); }
                results.push(await this.buildUpdateDto(countedItem, dto));
            }
        }
        return results;
    }

    public inventoryItemById(id: number): this {
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'item', id);
    }

    public inventoryItemByName(name: string): this {
        return this.setPropByName(this.itemService.findOne.bind(this.itemService), 'item', name);
    }

    public unitAmount(amount: number): this {
        if(amount === 0){
            return this.setPropByVal('unitAmount', 1);
        }
        return this.setPropByVal('unitAmount', amount);
    }

    public sizeById(id: number): this {
        return this.setPropById(this.sizeService.findOne.bind(this.sizeService), 'size', id);
    }

    public sizeByBuilder(inventoryItemId: number, dto: (CreateInventoryItemSizeDto | UpdateInventoryItemSizeDto)): this {
        const enrichedDto = {
            ...dto,
            inventoryItemId,
        }
        return this.setPropByBuilder(this.itemSizeBuilder.buildDto.bind(this.itemSizeBuilder), 'size', this.entity, enrichedDto);
    }

    public areaCountById(id: number): this {
        return this.setPropById(this.countService.findOne.bind(this.countService), 'areaCount', id);
    }
}