import { forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RecipeSubCategoryBuilder } from "../builders/recipe-sub-category.builder";
import { CreateRecipeSubCategoryDto } from "../dto/create-recipe-sub-category.dto";
import { UpdateRecipeSubCategoryDto } from "../dto/update-recipe-sub-category.dto";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { RecipeCategoryService } from "./recipe-category.service";

export class RecipeSubCategoryService extends ServiceBase<RecipeSubCategory>{
    constructor(
        @InjectRepository(RecipeSubCategory)
        private readonly subCategoryRepo: Repository<RecipeSubCategory>,
        private readonly subCategoryBuilder: RecipeSubCategoryBuilder,

        @Inject(forwardRef(() => RecipeCategoryService))
        private readonly categoryService: RecipeCategoryService,
    ){ super(subCategoryRepo, subCategoryBuilder, 'RecipeSubCategoryService'); }

    /**
     * Requires a name and a recipe ID for parent
     */
    async create(createDto: CreateRecipeSubCategoryDto): Promise<RecipeSubCategory | null> {
        const parentCategory = await this.categoryService.findOne(createDto.parentCategoryId);
        if(!parentCategory){ throw new Error("parent category not found"); }

        const exists = await this.findOneByCategoryNameAndSubCategoryName(parentCategory.name, createDto.name);
        if(exists) { return null; }

        const subCategory = await this.subCategoryBuilder.buildCreateDto(createDto);
        return await this.subCategoryRepo.save(subCategory);
    }
    
    /**
    * Uses Repository.Save(), NOt Repository.Update()
    */
    async update(id: number, updateDto: UpdateRecipeSubCategoryDto): Promise< RecipeSubCategory | null> {
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }
        
        await this.subCategoryBuilder.buildUpdateDto(toUpdate, updateDto);
        return await this.subCategoryRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: Array<keyof RecipeSubCategory>): Promise<RecipeSubCategory | null> {
        return this.subCategoryRepo.findOne({
            where: {
                name: name
            },
            relations
        });
    }

    /**
     * Returns a list of a categories sub-categories
     */
    async findByCategoryName(name: string, relations?: Array<keyof RecipeSubCategory>): Promise<RecipeSubCategory[]>{
        const category = await this.categoryService.findOneByName(name, ["subCategories"]);
        if(!category){ throw new Error("category not found"); }
        if(!category.subCategories){ throw new Error("sub-categories not found"); }

        return category.subCategories;
    }

    async findByCategoryId(id: number, relations?: Array<keyof RecipeSubCategory>): Promise<RecipeSubCategory[]>{
        const category = await this.categoryService.findOne(id, ["subCategories"]);
        if(!category){ throw new Error("category not found"); }
        if(!category.subCategories){ throw new Error("sub-categories not found"); }

        return category.subCategories;
    }

    /**
     * Returns one sub-category given the sub category name and the parentCategory name.
     */
    async findOneByCategoryNameAndSubCategoryName(categoryName: string, subCategoryName: string,  relations?: Array<keyof RecipeSubCategory>
    ): Promise<RecipeSubCategory | null>{
        const category = await this.categoryService.findOneByName(categoryName);
        if(!category){ 
            throw new Error("category not found"); 
        }

        return await this.subCategoryRepo.findOne({
            where: { 
                parentCategory: category, 
                name: subCategoryName 
            }, 
            relations});
    }
}