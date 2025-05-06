import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RecipeCategoryBuilder } from "../builders/recipe-category.builder";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeCategoryValidator } from "../validators/recipe-category.validator";

export class RecipeCategoryService extends ServiceBase<RecipeCategory>{
    constructor(
        @InjectRepository(RecipeCategory)
        private readonly categoryRepo: Repository<RecipeCategory>,
        categoryBuilder: RecipeCategoryBuilder,
        validator: RecipeCategoryValidator,
    ){ super(categoryRepo, categoryBuilder, validator, 'RecipeCategoryService'); }

    async findOneByName(name: string, relations?: Array<keyof RecipeCategory>): Promise<RecipeCategory | null> {
        return await this.categoryRepo.findOne({ where: { name: name}, relations });
    }
}