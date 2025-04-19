import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RecipeBuilder } from "../builders/recipe.builder";
import { CreateRecipeDto } from "../dto/create-recipe.dto";
import { UpdateRecipeDto } from "../dto/update-recipe-dto";
import { Recipe } from "../entities/recipe.entity";

export class RecipeService extends ServiceBase<Recipe>{
    constructor(
        @InjectRepository(Recipe)
        private readonly recipeRepo: Repository<Recipe>,
        private readonly recipeBuilder: RecipeBuilder,
    ){ super(recipeRepo); }

    async create(dto: CreateRecipeDto): Promise<Recipe | null> {
        const exists = await this.findOneByName(dto.name);
        if(exists) { return null; }

        const recipe = await this.recipeBuilder.buildCreateDto(dto);
        return await this.recipeRepo.save(recipe);
    }
        
    /**
    * Uses Repository.Save(), not Repository.Update
    */
    async update(id: number, updateDto: UpdateRecipeDto): Promise<Recipe | null> {
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }

        await this.recipeBuilder.buildUpdateDto(toUpdate, updateDto);
        return await this.recipeRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: Array<keyof Recipe>): Promise<Recipe | null> {
        return this.recipeRepo.findOne({ where: {name: name }, relations});
    }

    async findByIsIngredient(relations?: Array<keyof Recipe>): Promise<Recipe[]> {
        return this.recipeRepo.find({where: { isIngredient: true }});
    }
}