import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { CreateInventoryItemSizeDto } from "../dto/create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../dto/update-inventory-item-size.dto";
import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";
import { InventoryItemService } from "../services/inventory-item.service";
import { BuilderMethodBase } from "../../../base/builder-method-base";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";
import { InventoryItem } from "../entities/inventory-item.entity";

@Injectable()
export class InventoryItemSizeBuilder {
    private size: InventoryItemSize;

    private packageMethods: BuilderMethodBase<InventoryItemPackage>;
    private unitMethods: BuilderMethodBase<UnitOfMeasure>;
    private itemMethods: BuilderMethodBase<InventoryItem>;

    constructor(
        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,

        private readonly packageService: InventoryItemPackageService,
        private readonly unitService: UnitOfMeasureService,
    ){ 
        this.reset(); 
        this.packageMethods = new BuilderMethodBase(this.packageService, this.packageService.findOneByName.bind(this.packageService))
        this.unitMethods = new BuilderMethodBase(this.unitService, this.unitService.findOneByName.bind(this.unitService));
        this.itemMethods = new BuilderMethodBase(this.itemService, this.itemService.findOneByName.bind(this.itemService));
    }

    public reset(): this{
        this.size = new InventoryItemSize();
        return this;
    }

    public async unitOfMeasureById(id: number): Promise<this> {
        await this.unitMethods.entityById(
            (unit) => {this.size.measureUnit = unit; },
            id,
        )
        return this;
    }

    public async unitOfMeasureByName(name: string): Promise<this> {
        await this.unitMethods.entityByName(
            (unit) => {this.size.measureUnit = unit; },
            name,
        )
        return this;
    }

    public async packageById(id: number): Promise<this> {
        await this.packageMethods.entityById(
            (pkg) => {this.size.packageType = pkg; },
            id,
        )
        return this;
    }

    public async packageByName(name: string): Promise<this> {
        await this.packageMethods.entityByName(
            (pkg) => {this.size.packageType = pkg; },
            name,
        )
        return this;
    }

    public async InventoryItemById(id: number): Promise<this> {
        await this.itemMethods.entityById(
            (item) => {this.size.item = item; },
            id,
        )
        return this;
    }

    public async InventoryItemByName(name: string): Promise<this> {
        await this.itemMethods.entityByName(
            (item) => {this.size.item = item; },
            name,
        );
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