import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";

@Injectable()
export class RecipeSubCategoryValidator extends ValidatorBase<RecipeSubCategory> {
    constructor(
        @InjectRepository(RecipeSubCategory)
        private readonly repo: Repository<RecipeSubCategory>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}