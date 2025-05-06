import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";

@Injectable()
export class RecipeIngredientValidator extends ValidatorBase<RecipeIngredient> {
    constructor(
        @InjectRepository(RecipeIngredient)
        private readonly repo: Repository<RecipeIngredient>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}