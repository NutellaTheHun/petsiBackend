import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { RecipeCategory } from "../entities/recipe-category.entity";

@Injectable()
export class RecipeCategoryValidator extends ValidatorBase<RecipeCategory> {
    constructor(
        @InjectRepository(RecipeCategory)
        private readonly repo: Repository<RecipeCategory>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}