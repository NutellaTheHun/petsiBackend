import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { CreateInventoryItemPackageDto } from "../dto/inventory-item-package/create-inventory-item-package.dto";
import { UpdateInventoryItemPackageDto } from "../dto/inventory-item-package/update-inventory-item-package.dto";

@Injectable()
export class InventoryItemPackageValidator extends ValidatorBase<InventoryItemPackage> {
    constructor(
        @InjectRepository(InventoryItemPackage)
        private readonly repo: Repository<InventoryItemPackage>,
    ){ super(repo); }

    public async validateCreate(dto: CreateInventoryItemPackageDto): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { name: dto.name }});
        if(exists) { 
            return `Inventory item package with name ${dto.name} already exists`; 
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateInventoryItemPackageDto): Promise<string | null> {
        return null;
    }
}