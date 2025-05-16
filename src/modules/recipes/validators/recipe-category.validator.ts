import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { CreateRecipeCategoryDto } from "../dto/create-recipe-category.dto";
import { UpdateRecipeCategoryDto } from "../dto/update-recipe-category.dto";

@Injectable()
export class RecipeCategoryValidator extends ValidatorBase<RecipeCategory> {
    constructor(
        @InjectRepository(RecipeCategory)
        private readonly repo: Repository<RecipeCategory>,
    ){ super(repo); }

    public async validateCreate(dto: CreateRecipeCategoryDto): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { name: dto.name }});
        if(exists) { 
            return `Recipe category with name ${dto.name} already exists`; 
        }
        return null;
    }
    public async validateUpdate(dto: UpdateRecipeCategoryDto): Promise<string | null> {
        return null;
    }
}