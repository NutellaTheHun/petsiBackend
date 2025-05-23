import { forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { RecipeBuilder } from "../builders/recipe.builder";
import { Recipe } from "../entities/recipe.entity";

export class RecipeService extends ServiceBase<Recipe> {
    constructor(
        @InjectRepository(Recipe)
        private readonly repo: Repository<Recipe>,

        @Inject(forwardRef(() => RecipeBuilder))
        builder: RecipeBuilder,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'RecipeService', requestContextService, logger); }

    async findOneByName(name: string, relations?: Array<keyof Recipe>): Promise<Recipe | null> {
        return this.repo.findOne({ where: { recipeName: name }, relations });
    }
}