import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { Recipe } from "../entities/recipe.entity";
import { CreateRecipeDto } from "../dto/recipe/create-recipe.dto";
import { UpdateRecipeDto } from "../dto/recipe/update-recipe-dto";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { RecipeService } from "../services/recipe.service";

@Injectable()
export class RecipeValidator extends ValidatorBase<Recipe> {
    constructor(
        @InjectRepository(Recipe)
        private readonly repo: Repository<Recipe>,

        @Inject(forwardRef(() => RecipeService))
        private readonly recipeService: RecipeService,
        
        @Inject(forwardRef(() => RecipeCategoryService))
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
    
    public async validateUpdate(id: number, dto: UpdateRecipeDto): Promise<string | null> {
        if(dto.categoryId && dto.subCategoryId){
            const category = await this.categoryService.findOne(dto.categoryId, ['subCategories']);
            if(!category.subCategories){ throw new Error('subcategories is null'); }

            if(!category.subCategories.find(cat => cat.id === dto.subCategoryId)){
                return 'subcategory must be a child to the given RecipeCategory';
            }
        }
        else if(!dto.categoryId && dto.subCategoryId){
            const currentCategory = (await this.recipeService.findOne(id, ['category'], ['category.subCategories'])).category;
            if(!currentCategory){ 
                return 'cannot assign a sub-category without an assigned category'
             }
            if(!currentCategory.subCategories){ throw new Error('sub-categories is null'); }

            if(!currentCategory.subCategories.find(cat => cat.id === dto.subCategoryId)){
                return 'subcategory must be a child to the given RecipeCategory';
            }
        }

        return null;
    }
}