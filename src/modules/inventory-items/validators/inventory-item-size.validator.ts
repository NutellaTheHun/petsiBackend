import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { CreateChildInventoryItemSizeDto } from "../dto/inventory-item-size/create-child-inventory-item-size.dto";
import { UpdateChildInventoryItemSizeDto } from "../dto/inventory-item-size/update-child-inventory-item-size.dto";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";
import { UpdateInventoryItemSizeDto } from "../dto/inventory-item-size/update-inventory-item-size.dto";
import { ValidationError } from "../../../util/exceptions/validationError";

@Injectable()
export class InventoryItemSizeValidator extends ValidatorBase<InventoryItemSize> {
    constructor(
        @InjectRepository(InventoryItemSize)
        private readonly repo: Repository<InventoryItemSize>,

        @Inject(forwardRef(() => InventoryItemSizeService))
        private readonly sizeService: InventoryItemSizeService,
    ){ super(repo); }

    public async validateCreate(dto: CreateChildInventoryItemSizeDto): Promise<ValidationError[]> {
        return this.errors;
    }
    
    public async validateUpdate(id: number, dto: UpdateChildInventoryItemSizeDto | UpdateInventoryItemSizeDto): Promise<ValidationError[]> {
        if(dto.measureUnitId || dto.inventoryPackageId){
            const currentSize = await this.sizeService.findOne(id, ['inventoryItem', 'measureUnit', 'packageType'])
            const exists = await this.repo.findOne({
                where: { 
                    measureUnit: { id: dto.measureUnitId ?? currentSize.measureUnit.id },
                    packageType: { id: dto.inventoryPackageId ?? currentSize.packageType.id },
                    inventoryItem: { id: currentSize.inventoryItem.id }
                }
            });
            if(exists){ 
                this.addError({
                    error: 'Inventory item size already already exists',
                    status: 'EXIST',
                    contextEntity: 'UpdateInventoryItemSizeDto',
                    contextId: id,
                    sourceEntity: 'InventoryItemSize',
                } as ValidationError); 
            }
        }
        return this.errors;
    }
}