import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RecipeSubCategoryBuilder } from "../builders/recipe-sub-category.builder";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { RecipeSubCategoryValidator } from "../validators/recipe-sub-category.validator";

export class RecipeSubCategoryService extends ServiceBase<RecipeSubCategory>{
    constructor(
        @InjectRepository(RecipeSubCategory)
        private readonly subCategoryRepo: Repository<RecipeSubCategory>,
        subCategoryBuilder: RecipeSubCategoryBuilder,
        validator: RecipeSubCategoryValidator,
    ){ super(subCategoryRepo, subCategoryBuilder, validator, 'RecipeSubCategoryService'); }

    async findOneByName(name: string, relations?: Array<keyof RecipeSubCategory>): Promise<RecipeSubCategory | null> {
        return this.subCategoryRepo.findOne({ where: { name: name }, relations });
    }
}