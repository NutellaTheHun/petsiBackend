import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InventoryItem } from "../entities/inventory-item.entity";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";
import { InventoryItemVendorService } from "../services/inventory-item-vendor.service";
import { CreateInventoryItemDto } from "../dto/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "../dto/update-inventory-item.dto";

@Injectable()
export class InventoryItemBuilder {
    private item: InventoryItem;

    constructor(
        @Inject(forwardRef(() => InventoryItemCategoryService))
        private readonly categoryService: InventoryItemCategoryService,
    
        @Inject(forwardRef(() => InventoryItemSizeService))
        private readonly sizeService: InventoryItemSizeService,
    
        @Inject(forwardRef(() => InventoryItemVendorService))
        private readonly vendorService: InventoryItemVendorService,
    ){ this.reset(); }

    public reset(): this {
        this.item = new InventoryItem;
        return this;
    }

    public name(name: string): this {
        this.item.name = name;
        return this;
    }

    public async sizesByIds(ids: number[]): Promise<this> {
        this.item.sizes = await this.sizeService.findEntitiesById(ids);
        return this;
    }

    public async categoryById(id: number): Promise<this> {
        const category = await this.categoryService.findOne(id);
        if(!category){
            throw new Error("category not found");
        }
        this.item.category = category;
        return this;
    }

    public async categoryByName(name: string): Promise<this> {
        const category = await this.categoryService.findOneByName(name);
        if(!category){
            throw new Error("category not found");
        }
        this.item.category = category;
        return this;
    }

    public async vendorById(id: number): Promise<this> {
        const vendor = await this.vendorService.findOne(id);
        if(!vendor){
            throw new Error("category not found");
        }
        this.item.vendor = vendor;
        return this;
    }

    public async vendorByName(name: string): Promise<this> {
        const vendor = await this.vendorService.findOneByName(name);
        if(!vendor){
            throw new Error("category not found");
        }
        this.item.vendor = vendor;
        return this;
    }

    public getItem(): InventoryItem {
        const result = this.item;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateInventoryItemDto): Promise<InventoryItem> {
        this.reset();

        if(dto.inventoryItemCategoryId){
            await this.categoryById(dto.inventoryItemCategoryId)
        }

        if(dto.name){
            this.name(dto.name);
        }

        if(dto.sizeIds){
            await this.sizesByIds(dto.sizeIds);
        }

        if(dto.vendorId){
            await this.vendorById(dto.vendorId);
        }

        return this.getItem();
    }

    public updateItem(toUpdate: InventoryItem): this {
        this.item = toUpdate;
        return this;
    }

    public async buildUpdateDto(toUpdate: InventoryItem, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
        this.reset();

        this.updateItem(toUpdate);

        if(dto.inventoryItemCategoryId !== undefined){
            if(dto.inventoryItemCategoryId === 0){
                this.item.category = null;
            }
            else{
                await this.categoryById(dto.inventoryItemCategoryId);
            }
        }

        if(dto.name){
            this.name(dto.name);
        }

        if(dto.sizeIds){
            await this.sizesByIds(dto.sizeIds);
        }

        if(dto.vendorId !== undefined){
            if(dto.vendorId === 0){
                this.item.vendor = null;
            } else {
                await this.vendorById(dto.vendorId);
            }
        }

        return this.getItem();
    }
}