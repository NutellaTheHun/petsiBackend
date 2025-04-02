import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItemService } from "../services/inventory-item.service";
import { CreateInventoryItemCategoryDto } from "../dto/create-inventory-item-category.dto";
import { UpdateInventoryItemCategoryDto } from "../dto/update-inventory-item-category.dto";
import { BuilderMethodBase } from "../../../base/builder-method-base";
import { InventoryItem } from "../entities/inventory-item.entity";

@Injectable()
export class InventoryItemCategoryBuilder {
    private category: InventoryItemCategory;
    private taskQueue: (() => Promise<void>)[];
    
    private itemMethods: BuilderMethodBase<InventoryItem>;

    constructor(
        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,
    ){ 
        this.reset();
        this.itemMethods = new BuilderMethodBase(this.itemService, this.itemService.findOneByName.bind(this.itemService));
    }

    public reset(): this {
        this.category = new InventoryItemCategory();
        this.taskQueue = [];
        return this;
    }

    public name(name: string): this {
        this.category.name = name;
        return this;
    }

    public inventoryItemsById(ids: number[]): this {
        this.taskQueue.push(async () => {
            await this.itemMethods.entityByIds(
                (items) => { this.category.items = items; },
                ids,
            )
        });
        return this;
    }

    public async build(): Promise<InventoryItemCategory> {
        for(const task of this.taskQueue){
            await task();
        }
        
        const result = this.category;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateInventoryItemCategoryDto): Promise<InventoryItemCategory> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.inventoryItemIds){
            this.inventoryItemsById(dto.inventoryItemIds);
        }

        return await this.build();
    }

    public updateCategory(toUpdate: InventoryItemCategory): this{
        this.category = toUpdate;
        return this;
    }

    public async buildUpdateDto(toUpdate: InventoryItemCategory, dto: UpdateInventoryItemCategoryDto): Promise<InventoryItemCategory> {
        this.reset();
        this.updateCategory(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.inventoryItemIds){
            this.inventoryItemsById(dto.inventoryItemIds);
        }

        return await this.build();
    }
}