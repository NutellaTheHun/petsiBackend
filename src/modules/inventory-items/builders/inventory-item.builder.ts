import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateInventoryItemSizeDto } from "../dto/create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../dto/update-inventory-item-size.dto";
import { InventoryItem } from "../entities/inventory-item.entity";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";
import { InventoryItemVendorService } from "../services/inventory-item-vendor.service";
import { InventoryItemValidator } from "../validators/inventory-item.validator";
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

        @Inject(forwardRef(() => InventoryItemSizeBuilder))
        private readonly itemSizeBuilder: InventoryItemSizeBuilder,

        validator: InventoryItemValidator,
    ){ super(InventoryItem, validator); }

    protected createEntity(dto: any): void {
        if(dto.inventoryItemCategoryId){
            this.categoryById(dto.inventoryItemCategoryId)
        }
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.itemSizeDtos){
            this.sizesByBuilder(this.entity.id, dto.itemSizeDtos);
        }
        if(dto.vendorId){
            this.vendorById(dto.vendorId);
        }
    }

    protected updateEntity(dto: any): void {
        if(dto.inventoryItemCategoryId !== undefined){
            this.categoryById(dto.inventoryItemCategoryId);
        }
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.sizeDtos){
            this.sizesByBuilder(this.entity.id, dto.sizeDtos);
        }
        if(dto.vendorId !== undefined){
            this.vendorById(dto.vendorId);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('name', name);
    }

    public sizesByIds(ids: number[]): this {
        return this.setPropsByIds(this.sizeService.findEntitiesById.bind(this.sizeService), 'sizes', ids);
    }

    public sizesByBuilder(inventoryItemId: number, dtos: (CreateInventoryItemSizeDto | UpdateInventoryItemSizeDto)[]): this {
        const enrichedDtos = dtos.map( dto => ({
            ...dto,
            inventoryItemId
        }));
        return this.setPropByBuilder(this.itemSizeBuilder.buildManyChildDto.bind(this.itemSizeBuilder), 'sizes', this.entity, enrichedDtos);
    }
    
    public categoryById(id: number): this {
        if(id === 0){
            return this.setPropByVal('category', null);
        }
        return this.setPropById(this.categoryService.findOne.bind(this.categoryService), 'category', id);
    }

    public categoryByName(name: string): this {
        return this.setPropByName(this.categoryService.findOneByName.bind(this.categoryService), 'category', name);
    }

    public vendorById(id: number): this {
        if(id === 0){
            return this.setPropByVal('vendor', null);
        }
        return this.setPropById(this.vendorService.findOne.bind(this.vendorService), 'vendor', id);
    }

    public vendorByName(name: string): this {
        return this.setPropByName(this.vendorService.findOneByName.bind(this.vendorService), 'vendor', name);
    }
}