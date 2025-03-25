import { InjectRepository } from "@nestjs/typeorm";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RecipeCategoryFactory } from "../factories/recipe-category.factory";
import { CreateRecipeCategoryDto } from "../dto/create-recipe-category.dto";
import { forwardRef, Inject, NotImplementedException } from "@nestjs/common";
import { UpdateRecipeCategoryDto } from "../dto/update-recipe-category.dto";
import { RecipeService } from "./recipe.service";
import { RecipeSubCategoryService } from "./recipe-sub-category.service";

export class RecipeCategoryService extends ServiceBase<RecipeCategory>{
    constructor(
        @InjectRepository(RecipeCategory)
        private readonly categoryRepo: Repository<RecipeCategory>,

        private readonly categoryFactory: RecipeCategoryFactory,

        @Inject(forwardRef(() => RecipeService))
        private readonly recipeService: RecipeService,

        @Inject(forwardRef(() => RecipeSubCategoryService))
        private readonly subCategoryService: RecipeSubCategoryService,
    ){ super(categoryRepo); }

    /**
     * Creates a recipe category, with no sub-categories and no recipes
     * - sub-categories and recipes are assigned in Update()
     */
    async create(createDto: CreateRecipeCategoryDto): Promise<RecipeCategory | null> {
        
        const exists = await this.findOneByName(createDto.name);
        if(exists) { return null; }

        const category = this.categoryFactory.createEntityInstance({
            name: createDto.name,
        });

        return await this.categoryRepo.save(category);
    }
    
    /**
    * Uses Repository.Save(), NOT Repository.Update.
    */
    async update(id: number, updateDto: UpdateRecipeCategoryDto): Promise< RecipeCategory | null> {
        
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }
        
        if(updateDto.name){
            toUpdate.name = updateDto.name;
        }

        if(updateDto.recipeIds){
            const recipes = await this.recipeService.findEntitiesById(updateDto.recipeIds);
            toUpdate.recipes = recipes;
        }

        // handle if clearing all recipes?

        if(updateDto.subCategoryIds){
            const subCategories = await this.subCategoryService.findEntitiesById(updateDto.subCategoryIds);
            toUpdate.subCategories = subCategories;
        }

        // handle if clearing all sub categories?

        return await this.categoryRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: string[]): Promise<RecipeCategory | null> {
        return await this.categoryRepo.findOne({ where: { name: name}, relations });
    }
}