import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { Recipe } from "../entities/recipe.entity";

@Injectable()
export class RecipeValidator extends ValidatorBase<Recipe> {
    constructor(
        @InjectRepository(Recipe)
        private readonly repo: Repository<Recipe>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { name: dto.name }});
        if(exists) { 
            return 'Recipe already exists'; 
        }
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}