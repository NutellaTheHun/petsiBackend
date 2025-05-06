import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RecipeBuilder } from "../builders/recipe.builder";
import { Recipe } from "../entities/recipe.entity";
import { RecipeValidator } from "../validators/recipe.valdiator";

export class RecipeService extends ServiceBase<Recipe>{
    constructor(
        @InjectRepository(Recipe)
        private readonly recipeRepo: Repository<Recipe>,
        recipeBuilder: RecipeBuilder,
        validator: RecipeValidator,
    ){ super(recipeRepo, recipeBuilder, validator, 'RecipeService'); }
    
    async findOneByName(name: string, relations?: Array<keyof Recipe>): Promise<Recipe | null> {
        return this.recipeRepo.findOne({ where: {name: name }, relations});
    }
}