import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { CreateRecipeSubCategoryDto } from "../dto/recipe-sub-category/create-recipe-sub-category.dto";
import { UpdateRecipeCategoryDto } from "../dto/recipe-category/update-recipe-category.dto";
import { UpdateRecipeSubCategoryDto } from "../dto/recipe-sub-category/update-recipe-sub-category.dto";
import { UpdateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/update-child-recipe-sub-category.dto copy";

@Injectable()
export class RecipeSubCategoryValidator extends ValidatorBase<RecipeSubCategory> {
    constructor(
        @InjectRepository(RecipeSubCategory)
        private readonly repo: Repository<RecipeSubCategory>,
    ){ super(repo); }

    public async validateCreate(dto: CreateRecipeSubCategoryDto): Promise<string | null> {
        const exists = await this.repo.findOne({ 
            where: {
                subCategoryName: dto.subCategoryName,
                parentCategory: { id: dto.parentCategoryId }
        }});
        if(exists) {
            return `sub category for given category with name ${dto.subCategoryName} already exists`;
        }

        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateRecipeSubCategoryDto | UpdateChildRecipeSubCategoryDto): Promise<string | null> {
        if(dto.subCategoryName){
            const currentSubCat = await this.repo.findOne({ where: { id }, relations: ['parentCategory']});

            const exists = await this.repo.findOne({ 
                where: {
                    subCategoryName: dto.subCategoryName,
                    parentCategory: { id: currentSubCat?.parentCategory.id }
            }});
            if(exists) {
                return `sub category for given category with name ${dto.subCategoryName} already exists`;
            }
        }
        return null;
    }
}