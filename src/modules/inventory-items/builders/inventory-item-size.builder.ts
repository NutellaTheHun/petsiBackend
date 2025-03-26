import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { CreateInventoryItemSizeDto } from "../dto/create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../dto/update-inventory-item-size.dto";
import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";
import { InventoryItemService } from "../services/inventory-item.service";

@Injectable()
export class InventoryItemSizeBuilder {
    private size: InventoryItemSize;

    constructor(
        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,

        private readonly packageService: InventoryItemPackageService,
        private readonly unitService: UnitOfMeasureService,
    ){ this.reset(); }

    public reset(): this{
        this.size = new InventoryItemSize();
        return this;
    }

    public async unitOfMeasureById(id: number): Promise<this> {
        const unit = await this.unitService.findOne(id);
        if(!unit){
            throw new Error("unit of measure not found");
        }
        this.size.measureUnit = unit;
        return this;
    }

    public async unitOfMeasureByName(name: string): Promise<this> {
        const unit = await this.unitService.findOneByName(name);
        if(!unit){
            throw new Error("unit of measure not found");
        }
        this.size.measureUnit = unit;
        return this;
    }

    public async packageById(id: number): Promise<this> {
        const packageType = await this.packageService.findOne(id);
        if(!packageType){
            throw new Error("package not found");
        }
        this.size.packageType = packageType;
        return this;
    }

    public async packageByName(name: string): Promise<this> {
        const packageType = await this.packageService.findOneByName(name);
        if(!packageType){
            throw new Error("package not found");
        }
        this.size.packageType = packageType;
        return this;
    }

    public async InventoryItemById(id: number): Promise<this> {
        const item = await this.itemService.findOne(id);
        if(!item){
            throw new Error("item not found");
        }
        this.size.item = item;
        return this;
    }

    public async InventoryItemByName(name: string): Promise<this> {
        const item = await this.itemService.findOneByName(name);
        if(!item){
            throw new Error("item not found");
        }
        this.size.item = item;
        return this;
    }

    public getItemSize(): InventoryItemSize {
        const result = this.size;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateInventoryItemSizeDto): Promise<InventoryItemSize>{
        this.reset();

        if(dto.inventoryItemId){
            await this.InventoryItemById(dto.inventoryItemId);
        }

        if(dto.inventoryPackageTypeId){
            await this.packageById(dto.inventoryPackageTypeId);
        }

        if(dto.unitOfMeasureId){
            await this.unitOfMeasureById(dto.unitOfMeasureId);
        }

        return this.getItemSize();
    }

    public updateItemSize(toUpdate: InventoryItemSize): this{
        this.size = toUpdate;
        return this;
    }

    public async buildUpdateDto(toUpdate: InventoryItemSize, dto: UpdateInventoryItemSizeDto): Promise<InventoryItemSize> {
        this.reset();

        this.updateItemSize(toUpdate);

        if(dto.inventoryItemId){
            await this.InventoryItemById(dto.inventoryItemId);
        }

        if(dto.inventoryPackageTypeId){
            await this.packageById(dto.inventoryPackageTypeId);
        }

        if(dto.unitOfMeasureId){
            await this.unitOfMeasureById(dto.unitOfMeasureId);
        }

        return this.getItemSize();
    }
}