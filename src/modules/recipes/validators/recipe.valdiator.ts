import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { Recipe } from "../entities/recipe.entity";
import { CreateRecipeDto } from "../dto/create-recipe.dto";
import { UpdateRecipeDto } from "../dto/update-recipe-dto";
import { RecipeCategoryService } from "../services/recipe-category.service";

@Injectable()
export class RecipeValidator extends ValidatorBase<Recipe> {
    constructor(
        @InjectRepository(Recipe)
        private readonly repo: Repository<Recipe>,
        private readonly categoryService: RecipeCategoryService,
    ){ super(repo); }

    public async validateCreate(dto: CreateRecipeDto): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { name: dto.name }});
        if(exists) { 
            return `Recipe with name ${dto.name} already exists`; 
        }

        if(!dto.categoryId && dto.subCategoryId){
            return 'cannot assign a sub-category with a null category';
        }

        else if(dto.categoryId && dto.subCategoryId){
            const category = await this.categoryService.findOne(dto.categoryId, ['subCategories']);
            if(!category.subCategories){ throw new Error('subcategories is null'); }

            if(!category.subCategories.find(cat => cat.id === dto.subCategoryId)){
                return 'subcategory must be a child subcategory to the given RecipeCategory';
            }
        }

        return null;
    }
    public async validateUpdate(dto: UpdateRecipeDto): Promise<string | null> {
        if(dto.categoryId && dto.subCategoryId){
            const category = await this.categoryService.findOne(dto.categoryId, ['subCategories']);
            if(!category.subCategories){ throw new Error('subcategories is null'); }

            if(!category.subCategories.find(cat => cat.id === dto.subCategoryId)){
                return 'subcategory must be a child subcategory to the given RecipeCategory';
            }
        }

        else if(!dto.categoryId && dto.subCategoryId){
            // NEED TO ACCESS RECIPE TO GET CURRENT CATEGORY
            
            //return 'cannot assign a sub-category with a null category';
        }

        return null;
    }
}