import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { CreateRecipeCategoryDto } from "../dto/recipe-category/create-recipe-category.dto";
import { UpdateRecipeCategoryDto } from "../dto/recipe-category/update-recipe-category.dto";

@Injectable()
export class RecipeCategoryValidator extends ValidatorBase<RecipeCategory> {
    constructor(
        @InjectRepository(RecipeCategory)
        private readonly repo: Repository<RecipeCategory>,
    ){ super(repo); }

    public async validateCreate(dto: CreateRecipeCategoryDto): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { categoryName: dto.categoryName }});
        if(exists) { 
            return `Recipe category with name ${dto.categoryName} already exists`; 
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateRecipeCategoryDto): Promise<string | null> {
        return null;
    }
}