import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateInventoryItemDto } from "../dto/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "../dto/update-inventory-item.dto";
import { InventoryItem } from "../entities/inventory-item.entity";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";
import { InventoryItemVendorService } from "../services/inventory-item-vendor.service";
import { NO_CAT, NO_VENDOR } from "../utils/constants";
import { CreateInventoryItemSizeDto } from "../dto/create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../dto/update-inventory-item-size.dto";
import { InventoryItemSizeBuilder } from "./inventory-item-size.builder";

@Injectable()
export class InventoryItemBuilder extends BuilderBase<InventoryItem> {
    constructor(
        @Inject(forwardRef(() => InventoryItemCategoryService))
        private readonly categoryService: InventoryItemCategoryService,
    
        @Inject(forwardRef(() => InventoryItemSizeService))
        private readonly sizeService: InventoryItemSizeService,
    
        @Inject(forwardRef(() => InventoryItemVendorService))
        private readonly vendorService: InventoryItemVendorService,

        private readonly itemSizeBuilder: InventoryItemSizeBuilder,
    ){ super(InventoryItem); }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public sizesByIds(ids: number[]): this {
        return this.setPropsByIds(this.sizeService.findEntitiesById.bind(this.sizeService), 'sizes', ids);
    }

    public sizesByBuilderAfter(inventoryItemId: number, dtos: (CreateInventoryItemSizeDto | UpdateInventoryItemSizeDto)[]): this {
        const enrichedDtos = dtos.map( dto => ({
            ...dto,
            inventoryItemId
        }));
        return this.setPropAfterBuild(this.itemSizeBuilder.buildManyDto.bind(this.itemSizeBuilder), 'sizes', this.entity, enrichedDtos);
    }
    
    public categoryById(id: number): this {
        if(id === 0){
            return this.categoryByName(NO_CAT);
        }
        return this.setPropById(this.categoryService.findOne.bind(this.categoryService), 'category', id);
    }

    public categoryByName(name: string): this {
        return this.setPropByName(this.categoryService.findOneByName.bind(this.categoryService), 'category', name);
    }

    public vendorById(id: number): this {
        if(id === 0){
            return this.vendorByName(NO_VENDOR);
        }
        return this.setPropById(this.vendorService.findOne.bind(this.vendorService), 'vendor', id);
    }

    public vendorByName(name: string): this {
        return this.setPropByName(this.vendorService.findOneByName.bind(this.vendorService), 'vendor', name);
    }

    public async buildCreateDto(dto: CreateInventoryItemDto): Promise<InventoryItem> {
        this.reset();

        if(dto.inventoryItemCategoryId){
            this.categoryById(dto.inventoryItemCategoryId)
        } else {
            this.categoryByName(NO_CAT);
        }
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.itemSizeDtos){
            this.sizesByBuilderAfter(this.entity.id, dto.itemSizeDtos);
        }
        if(dto.vendorId){
            this.vendorById(dto.vendorId);
        }
        else {
            this.vendorByName(NO_VENDOR);
        }

        return await this.build();
    }

    public async buildUpdateDto(toUpdate: InventoryItem, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
        this.reset();
        this.updateEntity(toUpdate);

        // Passes id = 0 when clearing the category, so checks for undefined
        if(dto.inventoryItemCategoryId !== undefined){
            this.categoryById(dto.inventoryItemCategoryId);
        }
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.sizeDtos){
            this.sizesByBuilderAfter(this.entity.id, dto.sizeDtos);
        }
        // Passes id = 0 when clearing the vendor, so checks for undefined
        if(dto.vendorId !== undefined){
            this.vendorById(dto.vendorId);
        }

        return await this.build();
    }
}