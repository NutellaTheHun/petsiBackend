import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RecipeCategoryBuilder } from "../builders/recipe-category.builder";
import { CreateRecipeCategoryDto } from "../dto/create-recipe-category.dto";
import { UpdateRecipeCategoryDto } from "../dto/update-recipe-category.dto";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeCategoryValidator } from "../validators/recipe-category.validator";

export class RecipeCategoryService extends ServiceBase<RecipeCategory>{
    constructor(
        @InjectRepository(RecipeCategory)
        private readonly categoryRepo: Repository<RecipeCategory>,
        private readonly categoryBuilder: RecipeCategoryBuilder,
        validator: RecipeCategoryValidator,
    ){ super(categoryRepo, categoryBuilder, validator, 'RecipeCategoryService'); }

    /**
     * Creates a recipe category, with no sub-categories and no recipes
     * - sub-categories and recipes are assigned in Update()
     */
    async create(createDto: CreateRecipeCategoryDto): Promise<RecipeCategory | null> {
        const exists = await this.findOneByName(createDto.name);
        if(exists) { return null; }

        const category = await this.categoryBuilder.buildCreateDto(createDto);
        return await this.categoryRepo.save(category);
    }

    /**
    * Uses Repository.Save(), Not Repository.Update()
    */
    async update(id: number, updateDto: UpdateRecipeCategoryDto): Promise< RecipeCategory | null> {
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }
        
        await this.categoryBuilder.buildUpdateDto(toUpdate, updateDto);
        return await this.categoryRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: Array<keyof RecipeCategory>): Promise<RecipeCategory | null> {
        return await this.categoryRepo.findOne({ where: { name: name}, relations });
    }
}