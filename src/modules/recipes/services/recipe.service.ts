import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { RecipeBuilder } from "../builders/recipe.builder";
import { Recipe } from "../entities/recipe.entity";

@Injectable()
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

    protected applySearch(query: SelectQueryBuilder<Recipe>, search: string): void {
        query
            .leftJoin('entity.ingredients', 'ingredient')
            .leftJoin('ingredient.ingredientInventoryItem', 'inventoryItem')
            .leftJoin('ingredient.ingredientRecipe', 'subRecipe')
            .andWhere(`
            LOWER(entity.recipeName) LIKE :search
            OR LOWER(inventoryItem.itemName) LIKE :search
            OR LOWER(subRecipe.recipeName) LIKE :search
        `, { search: `%${search.toLowerCase()}%` });
    }

    protected applyFilters(query: SelectQueryBuilder<Recipe>, filters: Record<string, string>): void {
        if (filters.category) {
            query.andWhere('entity.category = :category', { category: filters.category });
        }
        if (filters.subCategory) {
            query.andWhere('entity.subCategory = :subCategory', { subCategory: filters.subCategory });
        }
    }
}