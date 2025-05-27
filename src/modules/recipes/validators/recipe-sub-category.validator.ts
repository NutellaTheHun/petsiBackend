import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { CreateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/create-child-recipe-sub-category.dto";
import { UpdateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/update-child-recipe-sub-category.dto copy";
import { UpdateRecipeSubCategoryDto } from "../dto/recipe-sub-category/update-recipe-sub-category.dto";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";

@Injectable()
export class RecipeSubCategoryValidator extends ValidatorBase<RecipeSubCategory> {
    constructor(
        @InjectRepository(RecipeSubCategory)
        private readonly repo: Repository<RecipeSubCategory>,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(repo, 'RecipeSubCategory', requestContextService, logger); }

    public async validateCreate(dto: CreateChildRecipeSubCategoryDto): Promise<void> {
        if (await this.helper.exists(this.repo, 'subCategoryName', dto.subCategoryName)) {
            this.addError({
                errorMessage: 'Recipe subcategory already exists. (name is in use accross all subcategories)',
                errorType: 'EXIST',
                contextEntity: 'CreateRecipeSubCategoryDto',
                sourceEntity: 'RecipeSubCategory',
                value: dto.subCategoryName,
            } as ValidationError);
        }

        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateRecipeSubCategoryDto | UpdateChildRecipeSubCategoryDto): Promise<void> {
        if (dto.subCategoryName) {
            if (await this.helper.exists(this.repo, 'subCategoryName', dto.subCategoryName)) {
                this.addError({
                    errorMessage: 'Recipe subcategory already exists. (name is in use accross all subcategories)',
                    errorType: 'EXIST',
                    contextEntity: 'CreateRecipeSubCategoryDto',
                    contextId: id,
                    sourceEntity: 'RecipeSubCategory',
                    value: dto.subCategoryName,
                } as ValidationError);
            }
        }

        this.throwIfErrors()
    }
}