import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { CreateInventoryItemCategoryDto } from "../dto/inventory-item-category/create-inventory-item-category.dto";
import { UpdateInventoryItemCategoryDto } from "../dto/inventory-item-category/update-inventory-item-category.dto";
import { ValidationError } from "../../../util/exceptions/validationError";

@Injectable()
export class InventoryItemCategoryValidator extends ValidatorBase<InventoryItemCategory> {
    constructor(
        @InjectRepository(InventoryItemCategory)
        private readonly repo: Repository<InventoryItemCategory>,
    ){ super(repo); }

    public async validateCreate(dto: CreateInventoryItemCategoryDto): Promise<ValidationError[]> {
        // Already exists check
        if(await this.helper.exists(this.repo, 'categoryName', dto.itemCategoryName)) { 
            this.addError({
                error: 'Inventory category name already exists',
                status: 'EXIST',
                contextEntity: 'CreateInventoryItemCategoryDto',
                sourceEntity: 'InventoryCategory',
                value: dto.itemCategoryName,
            } as ValidationError);
        }
        return this.errors;
    }
    
    public async validateUpdate(id: number, dto: UpdateInventoryItemCategoryDto): Promise<ValidationError[]> {
        // Already exists check
        if(dto.itemCategoryName){
            if(await this.helper.exists(this.repo, 'categoryName', dto.itemCategoryName)) { 
                this.addError({
                    error: 'Inventory category name already exists',
                    status: 'EXIST',
                    contextEntity: 'UpdateInventoryItemCategoryDto',
                    contextId: id,
                    sourceEntity: 'InventoryCategory',
                    value: dto.itemCategoryName,
                } as ValidationError);
            }
        }
        return this.errors;
    }
}