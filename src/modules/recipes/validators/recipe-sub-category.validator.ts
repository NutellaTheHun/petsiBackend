import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/create-child-recipe-sub-category.dto";
import { UpdateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/update-child-recipe-sub-category.dto copy";
import { UpdateRecipeSubCategoryDto } from "../dto/recipe-sub-category/update-recipe-sub-category.dto";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { ValidationError } from "../../../util/exceptions/validationError";

@Injectable()
export class RecipeSubCategoryValidator extends ValidatorBase<RecipeSubCategory> {
    constructor(
        @InjectRepository(RecipeSubCategory)
        private readonly repo: Repository<RecipeSubCategory>,
    ){ super(repo); }

    public async validateCreate(dto: CreateChildRecipeSubCategoryDto): Promise<ValidationError[]> {
        if(await this.helper.exists(this.repo, 'subCategoryName', dto.subCategoryName)) {
            this.addError({
                error: 'Recipe subcategory already exists. (name is in use accross all subcategories)',
                status: 'EXIST',
                contextEntity: 'CreateRecipeSubCategoryDto',
                sourceEntity: 'RecipeSubCategory',
                value: dto.subCategoryName,
            } as ValidationError);
        }

        return this.errors;
    }
    
    public async validateUpdate(id: number, dto: UpdateRecipeSubCategoryDto | UpdateChildRecipeSubCategoryDto): Promise<ValidationError[]> {
        if(dto.subCategoryName){
            if(await this.helper.exists(this.repo, 'subCategoryName', dto.subCategoryName)) {
                this.addError({
                    error: 'Recipe subcategory already exists. (name is in use accross all subcategories)',
                    status: 'EXIST',
                    contextEntity: 'CreateRecipeSubCategoryDto',
                    contextId: id,
                    sourceEntity: 'RecipeSubCategory',
                    value: dto.subCategoryName,
                } as ValidationError);
            }
        }

        return this.errors;
    }
}