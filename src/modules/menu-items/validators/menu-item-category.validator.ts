import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { CreateMenuItemCategoryDto } from "../dto/menu-item-category/create-menu-item-category.dto";
import { UpdateMenuItemCategoryDto } from "../dto/menu-item-category/update-menu-item-category.dto";
import { ValidationError } from "../../../util/exceptions/validationError";

@Injectable()
export class MenuItemCategoryValidator extends ValidatorBase<MenuItemCategory> {
    constructor(
        @InjectRepository(MenuItemCategory)
        private readonly repo: Repository<MenuItemCategory>,
    ){ super(repo); }

    public async validateCreate(dto: CreateMenuItemCategoryDto): Promise<ValidationError[]> {
        if(await this.helper.exists(this.repo, 'categoryName', dto.categoryName)) { 
            this.addError({
                error: 'Menu category name already exists.',
                status: 'EXIST',
                contextEntity: 'CreateMenuItemCategoryDto',
                sourceEntity: 'MenuItemCategory',
                value: dto.categoryName,
            } as ValidationError)
        }
        
        return this.errors;
    }
    
    public async validateUpdate(id: number, dto: UpdateMenuItemCategoryDto): Promise<ValidationError[]> {
        if(dto.categoryName){
            if(await this.helper.exists(this.repo, 'categoryName', dto.categoryName)) { 
                this.addError({
                    error: 'Menu category name already exists.',
                    status: 'EXIST',
                    contextEntity: 'UpdateMenuItemCategoryDto',
                    contextId: id,
                    sourceEntity: 'MenuItemCategory',
                    value: dto.categoryName,
                } as ValidationError)
            }
        }
        
        return this.errors;
    }
}