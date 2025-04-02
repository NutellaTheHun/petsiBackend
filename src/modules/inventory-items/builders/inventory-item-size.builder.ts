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
    private taskQueue: (() => Promise<void>)[];

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
        this.taskQueue = [];
        return this;
    }

    public unitOfMeasureById(id: number): this {
        this.taskQueue.push(async () => {
            await this.unitMethods.entityById(
                (unit) => {this.size.measureUnit = unit; },
                id,
            )
        });
        return this;
    }

    public unitOfMeasureByName(name: string): this {
        this.taskQueue.push(async () => {
            await this.unitMethods.entityByName(
                (unit) => {this.size.measureUnit = unit; },
                name,
            )
        })
        return this;
    }

    public packageById(id: number): this {
        this.taskQueue.push(async () => {
            await this.packageMethods.entityById(
                (pkg) => {this.size.packageType = pkg; },
                id,
            )
        })
        return this;
    }

    public packageByName(name: string): this {
        this.taskQueue.push(async () => {
            await this.packageMethods.entityByName(
                (pkg) => {this.size.packageType = pkg; },
                name,
            )
        })
        return this;
    }

    public InventoryItemById(id: number): this {
        this.taskQueue.push(async () => {
            await this.itemMethods.entityById(
                (item) => {this.size.item = item; },
                id,
            )
        })
        return this;
    }

    public InventoryItemByName(name: string): this {
        this.taskQueue.push(async () => {
            await this.itemMethods.entityByName(
                (item) => {this.size.item = item; },
                name,
            );
        })
        return this;
    }

    public async build(): Promise<InventoryItemSize> {
        for(const task of this.taskQueue){
            await task();
        }
        
        const result = this.size;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateInventoryItemSizeDto): Promise<InventoryItemSize>{
        this.reset();

        if(dto.inventoryItemId){
            this.InventoryItemById(dto.inventoryItemId);
        }
        if(dto.inventoryPackageTypeId){
            this.packageById(dto.inventoryPackageTypeId);
        }
        if(dto.unitOfMeasureId){
            this.unitOfMeasureById(dto.unitOfMeasureId);
        }

        return this.build();
    }

    public updateItemSize(toUpdate: InventoryItemSize): this{
        this.size = toUpdate;
        return this;
    }

    public async buildUpdateDto(toUpdate: InventoryItemSize, dto: UpdateInventoryItemSizeDto): Promise<InventoryItemSize> {
        this.reset();
        this.updateItemSize(toUpdate);

        if(dto.inventoryItemId){
            this.InventoryItemById(dto.inventoryItemId);
        }
        if(dto.inventoryPackageTypeId){
            this.packageById(dto.inventoryPackageTypeId);
        }
        if(dto.unitOfMeasureId){
            this.unitOfMeasureById(dto.unitOfMeasureId);
        }

        return this.build();
    }
}