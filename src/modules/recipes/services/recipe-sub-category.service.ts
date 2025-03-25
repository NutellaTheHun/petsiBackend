import { InjectRepository } from "@nestjs/typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { Repository } from "typeorm";
import { RecipeIngredientFactory } from "../factories/recipe-ingredient.factory";
import { CreateRecipeSubCategoryDto } from "../dto/create-recipe-sub-category.dto";
import { UpdateRecipeSubCategoryDto } from "../dto/update-recipe-sub-category.dto";
import { forwardRef, Inject, NotImplementedException } from "@nestjs/common";
import { RecipeCategoryService } from "./recipe-category.service";
import { RecipeService } from "./recipe.service";

export class RecipeSubCategoryService extends ServiceBase<RecipeSubCategory>{
    constructor(
        @InjectRepository(RecipeSubCategory)
        private readonly subCategoryRepo: Repository<RecipeSubCategory>,

        private readonly subCategoryFactory: RecipeIngredientFactory,

        @Inject(forwardRef(() => RecipeCategoryService))
        private readonly categoryService: RecipeCategoryService,

        @Inject(forwardRef(() => RecipeService))
        private readonly recipeService: RecipeService,
    ){ super(subCategoryRepo); }

    /**
     * Requires a name and a recipe ID for parent
     */
    async create(createDto: CreateRecipeSubCategoryDto): Promise<RecipeSubCategory | null> {
        const parentCategory = await this.categoryService.findOne(createDto.parentCategoryId);
        if(!parentCategory){ throw new Error("parent category not found"); }

        const exists = await this.findOneByCategoryNameAndSubCategoryName(parentCategory.name, createDto.name);
        if(exists) { return null; }

        const subCategory = this.subCategoryFactory.createEntityInstance({
            parentCategory: parentCategory,
            name: createDto.name,
        });

        return await this.subCategoryRepo.save(subCategory);
    }
    
    /**
    * Uses Repository.Save(), NOt Repository.Update()
    */
    async update(id: number, updateDto: UpdateRecipeSubCategoryDto): Promise< RecipeSubCategory | null> {
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }
        
        if(updateDto.name){
            toUpdate.name = updateDto.name;
        }

        
        if(updateDto.parentCategoryId){
            const parentCategory = await this.categoryService.findOne(updateDto.parentCategoryId);
            if(!parentCategory){ throw new Error("parent category not found"); }

            toUpdate.parentCategory = parentCategory
        }

        if(updateDto.recipeIds){
            const recipes = await this.recipeService.findEntitiesById(updateDto.recipeIds);
            toUpdate.recipes = recipes;
        }

        return await this.subCategoryRepo.save(toUpdate);
    }

    /**
     * Returns a list of a categories sub-categories
     */
    async findByCategoryName(name: string, relations?: string[]): Promise<RecipeSubCategory[]>{
        const category = await this.categoryService.findOneByName(name, ["subCategories"]);
        if(!category){ throw new Error("category not found"); }

        return category.subCategories;
    }

    async findOneByCategoryNameAndSubCategoryName(
        categoryName: string, 
        subCategoryName: string,  
        relations?: string[]
    ): Promise<RecipeSubCategory | null>{
        const category = await this.categoryService.findOneByName(categoryName);
        if(!category){ 
            throw new Error("category not found"); 
        }

        const subCategory = await this.subCategoryRepo.findOne({
            where: { 
                parentCategory: category, 
                name: subCategoryName 
            }, 
            relations});
            
        return subCategory;
    }
}