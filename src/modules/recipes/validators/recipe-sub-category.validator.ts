import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { CreateRecipeSubCategoryDto } from "../dto/create-recipe-sub-category.dto";
import { UpdateRecipeCategoryDto } from "../dto/update-recipe-category.dto";

@Injectable()
export class RecipeSubCategoryValidator extends ValidatorBase<RecipeSubCategory> {
    constructor(
        @InjectRepository(RecipeSubCategory)
        private readonly repo: Repository<RecipeSubCategory>,
    ){ super(repo); }

    public async validateCreate(dto: CreateRecipeSubCategoryDto): Promise<string | null> {
        const exists = await this.repo.findOne({ 
            where: {
                name: dto.name,
                parentCategory: { id: dto.parentCategoryId }
        }});

        if(exists) {
            return `sub category for given category with name ${dto.name} already exists`;
        }

        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateRecipeCategoryDto): Promise<string | null> {
        return null;
    }
}