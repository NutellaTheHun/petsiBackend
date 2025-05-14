import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { RecipeBuilder } from "../builders/recipe.builder";
import { Recipe } from "../entities/recipe.entity";
import { RecipeValidator } from "../validators/recipe.valdiator";
import { forwardRef, Inject } from "@nestjs/common";

export class RecipeService extends ServiceBase<Recipe>{
    constructor(
        @InjectRepository(Recipe)
        private readonly recipeRepo: Repository<Recipe>,

        @Inject(forwardRef(() => RecipeBuilder))
        recipeBuilder: RecipeBuilder,

        validator: RecipeValidator,

        requestContextService: RequestContextService,
        
        logger: AppLogger,
    ){ super(recipeRepo, recipeBuilder, validator, 'RecipeService', requestContextService, logger); }
    
    async findOneByName(name: string, relations?: Array<keyof Recipe>): Promise<Recipe | null> {
        return this.recipeRepo.findOne({ where: {name: name }, relations});
    }
}