import { BadRequestException, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { RecipeSubCategoryBuilder } from "../builders/recipe-sub-category.builder";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { RecipeSubCategoryValidator } from "../validators/recipe-sub-category.validator";
import { CreateRecipeSubCategoryDto } from "../dto/recipe-sub-category/create-recipe-sub-category.dto";
import { RecipeCategory } from "../entities/recipe-category.entity";

export class RecipeSubCategoryService extends ServiceBase<RecipeSubCategory>{
    constructor(
        @InjectRepository(RecipeSubCategory)
        private readonly subCategoryRepo: Repository<RecipeSubCategory>,
        
        @Inject(forwardRef(() => RecipeSubCategoryBuilder))
        subCategoryBuilder: RecipeSubCategoryBuilder,

        validator: RecipeSubCategoryValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(subCategoryRepo, subCategoryBuilder, validator, 'RecipeSubCategoryService', requestContextService, logger); }

    /**
     * Depreciated, only created as a child through {@link RecipeCategory}.
     */
    public async create(dto: CreateRecipeSubCategoryDto): Promise<RecipeSubCategory> {
        throw new BadRequestException();
    }

    async findOneByName(name: string, relations?: Array<keyof RecipeSubCategory>): Promise<RecipeSubCategory | null> {
        return this.subCategoryRepo.findOne({ where: { subCategoryName: name }, relations });
    }
}