import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryItemSize } from "../entities/inventory-item-size.entity";

@Injectable()
export class InventoryItemSizeValidator extends ValidatorBase<InventoryItemSize> {
    constructor(
        @InjectRepository(InventoryItemSize)
        private readonly repo: Repository<InventoryItemSize>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        const exists = await this.repo.findOne({
            where: { 
                measureUnit: { id: dto.unitOfMeasureId },
                packageType: { id: dto.inventoryPackageTypeId },
                item: { id: dto.inventoryItemId } 
            }
        });
        if(exists){ 
            return 'Inventory item size already exists'; 
        }
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}