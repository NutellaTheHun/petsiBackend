import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/create-child-recipe-sub-category.dto";
import { UpdateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/update-child-recipe-sub-category.dto copy";
import { UpdateRecipeSubCategoryDto } from "../dto/recipe-sub-category/update-recipe-sub-category.dto";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";

@Injectable()
export class RecipeSubCategoryValidator extends ValidatorBase<RecipeSubCategory> {
    constructor(
        @InjectRepository(RecipeSubCategory)
        private readonly repo: Repository<RecipeSubCategory>,
    ){ super(repo); }

    public async validateCreate(dto: CreateChildRecipeSubCategoryDto): Promise<string | null> {
        const exists = await this.repo.findOne({ 
            where: {
                subCategoryName: dto.subCategoryName,
        }});
        if(exists) {
            return `sub category with name ${dto.subCategoryName} already exists`;
        }

        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateRecipeSubCategoryDto | UpdateChildRecipeSubCategoryDto): Promise<string | null> {
        if(dto.subCategoryName){
            const exists = await this.repo.findOne({ 
                where: {
                    subCategoryName: dto.subCategoryName,
            }});
            if(exists) {
                return `sub category with name ${dto.subCategoryName} already exists`;
            }
        }
        return null;
    }
}