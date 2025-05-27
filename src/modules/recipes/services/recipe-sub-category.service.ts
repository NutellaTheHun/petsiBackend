import { BadRequestException, Inject, Injectable, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { RecipeSubCategoryBuilder } from "../builders/recipe-sub-category.builder";
import { CreateRecipeSubCategoryDto } from "../dto/recipe-sub-category/create-recipe-sub-category.dto";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";

@Injectable()
export class RecipeSubCategoryService extends ServiceBase<RecipeSubCategory> {
    constructor(
        @InjectRepository(RecipeSubCategory)
        private readonly repo: Repository<RecipeSubCategory>,

        @Inject(forwardRef(() => RecipeSubCategoryBuilder))
        builder: RecipeSubCategoryBuilder,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'RecipeSubCategoryService', requestContextService, logger); }

    /**
     * Depreciated, only created as a child through {@link RecipeCategory}.
     */
    public async create(dto: CreateRecipeSubCategoryDto): Promise<RecipeSubCategory> {
        throw new BadRequestException();
    }

    async findOneByName(name: string, relations?: Array<keyof RecipeSubCategory>): Promise<RecipeSubCategory | null> {
        return this.repo.findOne({ where: { subCategoryName: name }, relations });
    }

    protected applySortBy(query: SelectQueryBuilder<RecipeSubCategory>, sortBy: string, sortOrder: "ASC" | "DESC"): void {
        if (sortBy === 'subCategoryName') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
    }
}