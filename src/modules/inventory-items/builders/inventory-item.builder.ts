import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InventoryItem } from "../entities/inventory-item.entity";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";
import { InventoryItemVendorService } from "../services/inventory-item-vendor.service";
import { CreateInventoryItemDto } from "../dto/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "../dto/update-inventory-item.dto";
import { BuilderMethodBase } from "../../../base/builder-method-base";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";

@Injectable()
export class InventoryItemBuilder {
    private item: InventoryItem;
    private taskQueue: (() => Promise<void>)[];

    private categoryMethods: BuilderMethodBase<InventoryItemCategory>;
    private sizeMethods: BuilderMethodBase<InventoryItemSize>;
    private vendorMethods: BuilderMethodBase<InventoryItemVendor>;

    constructor(
        @Inject(forwardRef(() => InventoryItemCategoryService))
        private readonly categoryService: InventoryItemCategoryService,
    
        @Inject(forwardRef(() => InventoryItemSizeService))
        private readonly sizeService: InventoryItemSizeService,
    
        @Inject(forwardRef(() => InventoryItemVendorService))
        private readonly vendorService: InventoryItemVendorService,
    ){ 
        this.reset(); 
        this.categoryMethods = new BuilderMethodBase(this.categoryService, this.categoryService.findOneByName.bind(this.categoryService));
        this.sizeMethods = new BuilderMethodBase(this.sizeService);
        this.vendorMethods = new BuilderMethodBase(this.vendorService, this.vendorService.findOneByName.bind(this.vendorService));
    }

    public reset(): this {
        this.item = new InventoryItem;
        this.taskQueue = [];
        return this;
    }

    public name(name: string): this {
        this.item.name = name;
        return this;
    }

    public sizesByIds(ids: number[]): this {
        this.taskQueue.push(async () => {
            await this.sizeMethods.entityByIds(
                (sizes) => { this.item.sizes = sizes},
                ids,
            );
        });
        return this;
    }
    
    public categoryById(id: number): this {
        this.taskQueue.push(async () => {
            await this.categoryMethods.entityById(
                (cat) => {this.item.category = cat; },
                id,
            );
        });
        return this;
    }

    public categoryByName(name: string): this {
        this.taskQueue.push(async () => {
            await this.categoryMethods.entityByName(
                (cat) => {this.item.category = cat; },
                name,
            );
        });
        return this;
    }

    public vendorById(id: number): this {
        this.taskQueue.push(async () => {
            await this.vendorMethods.entityById(
                (ven) => {this.item.vendor = ven; },
                id,
            );
        });
        return this;
    }

    public vendorByName(name: string): this {
        this.taskQueue.push(async () => {
            await this.vendorMethods.entityByName(
                (ven) => {this.item.vendor = ven; },
                name,
            );
        });
        return this;
    }

    public async build(): Promise<InventoryItem> {
        for(const task of this.taskQueue){
            await task();
        }

        const result = this.item;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateInventoryItemDto): Promise<InventoryItem> {
        this.reset();

        if(dto.inventoryItemCategoryId){
            this.categoryById(dto.inventoryItemCategoryId)
        }
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.sizeIds){
            this.sizesByIds(dto.sizeIds);
        }
        if(dto.vendorId){
            this.vendorById(dto.vendorId);
        }

        return await this.build();
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
                this.categoryById(dto.inventoryItemCategoryId);
            }
        }
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.sizeIds){
            this.sizesByIds(dto.sizeIds);
        }
        if(dto.vendorId !== undefined){
            if(dto.vendorId === 0){
                this.item.vendor = null;
            } else {
                this.vendorById(dto.vendorId);
            }
        }

        return await this.build();
    }
}