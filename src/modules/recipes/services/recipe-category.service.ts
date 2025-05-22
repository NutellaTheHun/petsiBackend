import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { RecipeCategoryBuilder } from "../builders/recipe-category.builder";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeCategoryValidator } from "../validators/recipe-category.validator";
import { forwardRef, Inject } from "@nestjs/common";

export class RecipeCategoryService extends ServiceBase<RecipeCategory>{
    constructor(
        @InjectRepository(RecipeCategory)
        private readonly categoryRepo: Repository<RecipeCategory>,

        @Inject(forwardRef(() => RecipeCategoryBuilder))
        categoryBuilder: RecipeCategoryBuilder,

        @Inject(forwardRef(() => RecipeCategoryValidator))
        validator: RecipeCategoryValidator,
        
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(categoryRepo, categoryBuilder, validator, 'RecipeCategoryService', requestContextService, logger); }

    async findOneByName(name: string, relations?: Array<keyof RecipeCategory>): Promise<RecipeCategory | null> {
        return await this.categoryRepo.findOne({ where: { categoryName: name}, relations });
    }
}