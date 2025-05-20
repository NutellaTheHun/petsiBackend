import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { CreateInventoryItemCategoryDto } from "../dto/inventory-item-category/create-inventory-item-category.dto";
import { UpdateInventoryItemCategoryDto } from "../dto/inventory-item-category/update-inventory-item-category.dto";

@Injectable()
export class InventoryItemCategoryValidator extends ValidatorBase<InventoryItemCategory> {
    constructor(
        @InjectRepository(InventoryItemCategory)
        private readonly repo: Repository<InventoryItemCategory>,
    ){ super(repo); }

    public async validateCreate(dto: CreateInventoryItemCategoryDto): Promise<string | null> {
        // Already exists check
        const exists = await this.repo.findOne({ where: { categoryName: dto.itemCategoryName }});
        if(exists) { 
            return `Inventory item with name ${dto.itemCategoryName} already exists`; 
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateInventoryItemCategoryDto): Promise<string | null> {
        // Already exists check
        const exists = await this.repo.findOne({ where: { categoryName: dto.itemCategoryName }});
        if(exists) { 
            return `Inventory item with name ${dto.itemCategoryName} already exists`; 
        }
        return null;
    }
}